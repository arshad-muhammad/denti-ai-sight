import { Point2D } from '@/types/dental';

interface LandmarkDetectionResult {
  landmarks?: {
    cej: Point2D;
    bone: Point2D;
    apex: Point2D;
    debug?: {
      edges: Point2D[];
      clusters: Point2D[][];
    };
  };
  warnings: { message: string }[];
}

interface ImageAnalysisResult {
  landmarks: {
    suggestions: Array<{
      type: 'cej' | 'bone' | 'apex';
      position: Point2D;
      confidence: number;
    }>;
  };
  warnings: { message: string }[];
}

export class ImageProcessingService {
  private static instance: ImageProcessingService;

  private constructor() {}

  public static getInstance(): ImageProcessingService {
    if (!ImageProcessingService.instance) {
      ImageProcessingService.instance = new ImageProcessingService();
    }
    return ImageProcessingService.instance;
  }

  public async detectLandmarks(imageData: ImageData): Promise<LandmarkDetectionResult> {
    try {
      console.log('Starting landmark detection');
      const width = imageData.width;
      const height = imageData.height;

      // Convert to grayscale and enhance contrast
      const enhancedData = this.enhanceImage(imageData);
      
      // Find edges using Sobel operator
      const edges = this.detectEdges(enhancedData, width, height, 15);
      console.log('Detected edges:', edges.length);

      // Pre-filter edges to focus on strong vertical edges
      const filteredEdges = edges.filter(edge => {
        const hasVerticalNeighbors = edges.some(other => 
          Math.abs(other.x - edge.x) <= 5 &&
          Math.abs(other.y - edge.y) > 5 &&
          Math.abs(other.y - edge.y) <= 20
        );
        return hasVerticalNeighbors;
      });
      
      // Find potential landmark points
      const points = this.findLandmarkPoints(filteredEdges, width, height);
      console.log('Initial landmark points:', points.length);

      if (points.length >= 3) {
        // Define tooth width constraints
        const maxToothWidth = width * 0.25;
        const minToothWidth = width * 0.05;

        // Group points into vertical columns (potential teeth)
        const teeth = this.groupPointsIntoTeeth(points, maxToothWidth);
        console.log('Detected tooth regions:', teeth.length);

        // Find the most likely tooth based on point distribution
        const bestTooth = this.findBestTooth(teeth, height);
        console.log('Best tooth points:', bestTooth?.length);
        
        if (bestTooth && bestTooth.length >= 3) {
          // Sort points by Y coordinate (top to bottom)
          const sortedPoints = [...bestTooth].sort((a, b) => a.y - b.y);

          // Calculate the average X coordinate (tooth's vertical axis)
          const avgX = bestTooth.reduce((sum, p) => sum + p.x, 0) / bestTooth.length;
          
          // Find points closest to anatomical positions
          const cej = this.findPointInRegion(sortedPoints, height * 0.35, avgX, maxToothWidth * 0.4);
          const bone = this.findPointInRegion(sortedPoints, height * 0.55, avgX, maxToothWidth * 0.4);
          const apex = this.findPointInRegion(sortedPoints, height * 0.75, avgX, maxToothWidth * 0.4);

          console.log('Found landmarks:', { cej: !!cej, bone: !!bone, apex: !!apex });

          if (cej && bone && apex && this.validateLandmarkAlignment(cej, bone, apex, maxToothWidth)) {
            console.log('Valid landmarks found within single tooth');
            return {
              landmarks: { 
                cej, 
                bone, 
                apex,
                debug: {
                  edges: filteredEdges,
                  clusters: teeth
                }
              },
              warnings: []
            };
          }
        }
      }

      return {
        warnings: [{ message: 'Could not detect valid landmarks. Please mark them manually.' }]
      };
    } catch (error) {
      console.error('Error detecting landmarks:', error);
      return {
        warnings: [{ message: 'Error detecting landmarks. Please try manual marking.' }]
      };
    }
  }

  private detectEdges(data: Uint8ClampedArray, width: number, height: number, threshold: number): Point2D[] {
    const edges: Point2D[] = [];
    const gradientMagnitudes: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
    const STRONG_EDGE = 40; // Reduced from 50
    const WEAK_EDGE = 15; // Reduced from 20

    // Compute gradient magnitudes
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const gx = this.sobelX(data, idx, width);
        const gy = this.sobelY(data, idx, width);
        gradientMagnitudes[y][x] = Math.sqrt(gx * gx + gy * gy);
      }
    }

    // Non-maximum suppression and hysteresis tracking with more tolerance
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const magnitude = gradientMagnitudes[y][x];
        
        if (magnitude > WEAK_EDGE) {
          // Check if it's a local maximum with some tolerance
          const isLocalMax = this.isLocalMaximum(gradientMagnitudes, x, y);
          
          if (isLocalMax && (magnitude > STRONG_EDGE || this.hasStrongNeighbor(gradientMagnitudes, x, y, STRONG_EDGE))) {
            edges.push({ x, y });
          }
        }
      }
    }

    return edges;
  }

  private sobelX(data: Uint8ClampedArray, idx: number, width: number): number {
    const w4 = width * 4;
    return (
      -1 * data[idx - 4 - w4] +
      1 * data[idx + 4 - w4] +
      -2 * data[idx - 4] +
      2 * data[idx + 4] +
      -1 * data[idx - 4 + w4] +
      1 * data[idx + 4 + w4]
    ) / 8;
  }

  private sobelY(data: Uint8ClampedArray, idx: number, width: number): number {
    const w4 = width * 4;
    return (
      -1 * data[idx - 4 - w4] +
      -2 * data[idx - w4] +
      -1 * data[idx + 4 - w4] +
      1 * data[idx - 4 + w4] +
      2 * data[idx + w4] +
      1 * data[idx + 4 + w4]
    ) / 8;
  }

  private isLocalMaximum(gradients: number[][], x: number, y: number): boolean {
    const value = gradients[y][x];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (gradients[y + dy][x + dx] > value) return false;
      }
    }
    return true;
  }

  private hasStrongNeighbor(gradients: number[][], x: number, y: number, threshold: number): boolean {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (gradients[y + dy][x + dx] > threshold) return true;
      }
    }
    return false;
  }

  private findLandmarkPoints(edges: Point2D[], width: number, height: number): Point2D[] {
    const clusters: Point2D[][] = [];
    const visited = new Set<string>();
    const minClusterSize = 3;

    // Focus on the central region of the image
    const centerX = width / 2;
    const searchWidth = width * 0.4; // Reduced from 0.5 to focus more centrally
    const minX = centerX - searchWidth / 2;
    const maxX = centerX + searchWidth / 2;

    // Pre-filter edges to focus on strong vertical edges in the central region
    const filteredEdges = edges.filter(edge => {
      // First, check if the edge is in the central region
      if (edge.x < minX || edge.x > maxX) {
        return false;
      }

      let verticalNeighborCount = 0;
      let hasUpperNeighbor = false;
      let hasLowerNeighbor = false;
      let neighborConnections = 0;

      for (const other of edges) {
        if (other === edge) continue;
        
        const xDiff = Math.abs(other.x - edge.x);
        const yDiff = other.y - edge.y; // Not using abs() to check direction
        
        if (xDiff <= 7) { // Horizontal tolerance
          if (yDiff > 5 && yDiff <= 20) { // Lower neighbor
            hasLowerNeighbor = true;
            verticalNeighborCount++;
            if (this.hasIntermediatePoints(edge, other, edges)) {
              neighborConnections++;
            }
          } else if (yDiff < -5 && yDiff >= -20) { // Upper neighbor
            hasUpperNeighbor = true;
            verticalNeighborCount++;
            if (this.hasIntermediatePoints(edge, other, edges)) {
              neighborConnections++;
            }
          }
        }
      }
      
      // Require either balanced vertical neighbors or multiple strong connections
      return (hasUpperNeighbor && hasLowerNeighbor) || neighborConnections >= 2;
    });

    console.log('Filtered edges for vertical structures:', filteredEdges.length);

    // Group points into vertical segments
    const verticalSegments: Point2D[][] = [];
    for (const point of filteredEdges) {
      const key = `${point.x},${point.y}`;
      if (visited.has(key)) continue;

      const segment = this.growVerticalSegment(point, filteredEdges, visited);
      if (segment.length >= minClusterSize) {
        verticalSegments.push(segment);
      }
    }

    console.log('Found vertical segments:', verticalSegments.length);

    // Score segments by vertical coverage and position
    const scoredSegments = verticalSegments.map(segment => {
      const yCoords = segment.map(p => p.y);
      const xCoords = segment.map(p => p.x);
      const avgX = xCoords.reduce((sum, x) => sum + x, 0) / segment.length;
      const spread = (Math.max(...yCoords) - Math.min(...yCoords)) / height;
      
      // Penalize segments far from center
      const distanceFromCenter = Math.abs(avgX - centerX) / (width / 2);
      const centralityScore = 1 - distanceFromCenter;
      
      return { 
        segment, 
        score: spread * segment.length * centralityScore * 2, // Increased weight of centrality
        avgX 
      };
    });

    // Take top segments
    scoredSegments.sort((a, b) => b.score - a.score);
    const topSegments = scoredSegments.slice(0, 5).map(s => s.segment); // Reduced from 10 to 5

    // Merge nearby segments into clusters
    visited.clear();
    for (const segment of topSegments) {
      if (segment.some(p => visited.has(`${p.x},${p.y}`))) continue;

      const cluster = this.mergeNearbySegments(segment, topSegments);
      if (cluster.length >= minClusterSize) {
        clusters.push(cluster);
      }
    }

    // Get points from all clusters
    const allPoints = clusters.reduce((acc, cluster) => [...acc, ...cluster], [] as Point2D[]);
    console.log('Total points from clusters:', allPoints.length);
    return allPoints;
  }

  private growVerticalSegment(start: Point2D, points: Point2D[], visited: Set<string>): Point2D[] {
    const segment: Point2D[] = [];
    const queue: Point2D[] = [start];
    const maxHorizontalDev = 7;  // Increased from 5

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      segment.push(current);

      // Find vertically aligned neighbors
      for (const point of points) {
        const pointKey = `${point.x},${point.y}`;
        if (visited.has(pointKey)) continue;

        const xDiff = Math.abs(point.x - current.x);
        const yDiff = Math.abs(point.y - current.y);

        if (xDiff <= maxHorizontalDev && yDiff <= 25) {
          queue.push(point);
        }
      }
    }

    return segment;
  }

  private mergeNearbySegments(segment: Point2D[], allSegments: Point2D[][]): Point2D[] {
    const merged: Point2D[] = [...segment];
    const maxDistance = 15; // Maximum distance between segments to merge

    for (const otherSegment of allSegments) {
      if (otherSegment === segment) continue;

      // Check if segments are close enough
      const shouldMerge = segment.some(p1 => 
        otherSegment.some(p2 => 
          Math.abs(p1.x - p2.x) <= maxDistance &&
          Math.abs(p1.y - p2.y) <= maxDistance
        )
      );

      if (shouldMerge) {
        merged.push(...otherSegment);
      }
    }

    return merged;
  }

  private findBestPoint(points: Point2D[], targetX: number, margin: number): Point2D | null {
    if (points.length === 0) return null;

    // Filter points within the margin of the target X
    const validPoints = points.filter(p => Math.abs(p.x - targetX) <= margin);
    if (validPoints.length === 0) return null;

    // Sort by distance to target X
    validPoints.sort((a, b) => 
      Math.abs(a.x - targetX) - Math.abs(b.x - targetX)
    );

    return validPoints[0];
  }

  public async analyzeImage(image: HTMLImageElement): Promise<ImageAnalysisResult> {
    return {
      landmarks: {
        suggestions: []
      },
      warnings: []
    };
  }

  public calculateDistance(point1: Point2D, point2: Point2D): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateClusterScore(cluster: Point2D[], width: number, height: number): number {
    const centroid = this.calculateCentroid(cluster);
    const density = cluster.length / this.calculateClusterArea(cluster);
    const verticalPosition = 1 - Math.abs(0.5 - centroid.y / height); // Favor points near vertical center
    
    return density * verticalPosition;
  }

  private calculateClusterArea(cluster: Point2D[]): number {
    const xs = cluster.map(p => p.x);
    const ys = cluster.map(p => p.y);
    const width = Math.max(...xs) - Math.min(...xs) + 1;
    const height = Math.max(...ys) - Math.min(...ys) + 1;
    return width * height;
  }

  private groupPointsIntoTeeth(points: Point2D[], maxWidth: number): Point2D[][] {
    const teeth: Point2D[][] = [];
    const usedPoints = new Set<string>();

    // Sort points by X coordinate
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);

    // Find vertical columns of points (potential teeth)
    let currentX = sortedPoints[0].x;
    let currentTooth: Point2D[] = [];

    for (const point of sortedPoints) {
      const key = `${point.x},${point.y}`;
      if (usedPoints.has(key)) continue;

      // If point is within maxWidth of current tooth's X position, add it to current tooth
      if (Math.abs(point.x - currentX) <= maxWidth * 0.5) {
        currentTooth.push(point);
        usedPoints.add(key);
      } else {
        // If we have enough points for a tooth, add it to the list
        if (currentTooth.length >= 3) {
          teeth.push(currentTooth);
        }
        // Start a new tooth
        currentTooth = [point];
        currentX = point.x;
        usedPoints.add(key);
      }
    }

    // Add the last tooth if it has enough points
    if (currentTooth.length >= 3) {
      teeth.push(currentTooth);
    }

    return teeth;
  }

  private findBestTooth(teeth: Point2D[][], imageHeight: number): Point2D[] | null {
    if (teeth.length === 0) return null;

    // Score each tooth based on point distribution and alignment
    const scoredTeeth = teeth.map(tooth => {
      const score = this.calculateToothScore(tooth, imageHeight);
      console.log(`Tooth score: ${score} (${tooth.length} points)`);
      return { tooth, score };
    });

    // Sort by score and return the best tooth
    scoredTeeth.sort((a, b) => b.score - a.score);
    return scoredTeeth[0].tooth;
  }

  private calculateToothScore(tooth: Point2D[], imageHeight: number): number {
    // Calculate vertical distribution
    const yPositions = tooth.map(p => p.y / imageHeight);
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);
    const verticalSpread = maxY - minY;

    // Check distribution in regions
    const hasTop = yPositions.some(y => y < 0.4);
    const hasMiddle = yPositions.some(y => y >= 0.4 && y < 0.7);
    const hasBottom = yPositions.some(y => y >= 0.7);

    // Basic distribution score
    let score = (hasTop ? 1 : 0) + (hasMiddle ? 1 : 0) + (hasBottom ? 1 : 0);

    // Bonus for good vertical spread
    if (verticalSpread >= 0.4 && verticalSpread <= 0.9) {
      score *= 1.5;
    }

    // Calculate horizontal alignment
    const xCoords = tooth.map(p => p.x);
    const avgX = xCoords.reduce((sum, x) => sum + x, 0) / tooth.length;
    const maxDeviation = Math.max(...xCoords.map(x => Math.abs(x - avgX)));
    const alignmentScore = 1 / (1 + maxDeviation * 0.1);

    return score * alignmentScore;
  }

  private findPointInRegion(points: Point2D[], targetY: number, targetX: number, maxDistance: number): Point2D | null {
    // Define region bounds with more flexibility for upper points
    const regionHeight = targetY < points[0].y ? targetY * 0.5 : targetY * 0.3;
    const minY = targetY - regionHeight;
    const maxY = targetY + regionHeight;

    // Filter points within the vertical region and near the target X
    let regionPoints = points.filter(p => 
      p.y >= minY && 
      p.y <= maxY && 
      Math.abs(p.x - targetX) <= maxDistance
    );

    if (regionPoints.length === 0 && targetY < points[0].y) {
      // For CEJ, expand search area below target
      regionPoints = points.filter(p =>
        p.y >= minY &&
        p.y <= targetY + regionHeight * 2 && // Look further down
        Math.abs(p.x - targetX) <= maxDistance * 1.5 // Wider horizontal search
      );
    }

    if (regionPoints.length === 0) {
      console.log(`No points found in region y=${targetY}±${regionHeight}`);
      return null;
    }

    // Score points based on position and density
    const scoredPoints = regionPoints.map(point => {
      const yDist = Math.abs(point.y - targetY);
      const xDist = Math.abs(point.x - targetX);
      
      // Base score from distance
      let score = -(yDist + xDist * 2);
      
      // Bonus for having neighbors
      const neighborCount = regionPoints.filter(p => 
        p !== point && 
        Math.abs(p.x - point.x) <= 10 && 
        Math.abs(p.y - point.y) <= 10
      ).length;
      
      score += neighborCount * 5;
      
      // Bonus for being closer to the center
      const centerBonus = 1 - Math.abs(point.x - targetX) / maxDistance;
      score *= (1 + centerBonus);

      return { point, score };
    });

    scoredPoints.sort((a, b) => b.score - a.score);
    return scoredPoints[0]?.point || null;
  }

  private validateLandmarkAlignment(cej: Point2D, bone: Point2D, apex: Point2D, maxWidth: number): boolean {
    // Calculate key measurements
    const totalLength = this.calculateDistance(cej, apex);
    const cejToBone = this.calculateDistance(cej, bone);
    const boneToApex = this.calculateDistance(bone, apex);

    // Log measurements for debugging
    console.log('Validating alignment:', {
      totalLength,
      cejToBone,
      boneToApex,
      cejToBoneRatio: cejToBone / totalLength,
      boneToApexRatio: boneToApex / totalLength
    });

    // Check vertical ordering with dynamic minimum gaps
    const minVerticalGap = Math.min(totalLength * 0.15, 20);
    if (!(cej.y + minVerticalGap < bone.y && bone.y + minVerticalGap < apex.y)) {
      console.log('Failed vertical ordering check', {
        cejY: cej.y,
        boneY: bone.y,
        apexY: apex.y,
        minGap: minVerticalGap
      });
      return false;
    }

    // Check horizontal alignment with dynamic tolerance
    const maxDeviation = Math.min(maxWidth * 0.4, totalLength * 0.25); // Increased tolerance
    const avgX = (cej.x + bone.x + apex.x) / 3;
    
    const deviations = {
      cej: Math.abs(cej.x - avgX),
      bone: Math.abs(bone.x - avgX),
      apex: Math.abs(apex.x - avgX)
    };

    if (Object.values(deviations).some(d => d > maxDeviation)) {
      console.log('Failed horizontal alignment check', {
        avgX,
        maxDeviation,
        deviations
      });
      return false;
    }

    // Validate relative distances with more flexible proportions
    const validProportions = 
      cejToBone < totalLength * 0.7 &&  // Increased max CEJ to Bone ratio
      cejToBone > totalLength * 0.1 &&  // Decreased min CEJ to Bone ratio
      boneToApex > totalLength * 0.2;   // Decreased min Bone to Apex ratio

    if (!validProportions) {
      console.log('Failed proportions check', {
        cejToBoneRatio: cejToBone / totalLength,
        boneToApexRatio: boneToApex / totalLength,
        requiredRatios: {
          maxCejToBone: 0.7,
          minCejToBone: 0.1,
          minBoneToApex: 0.2
        }
      });
    }

    return validProportions;
  }

  private enhanceImage(imageData: ImageData): Uint8ClampedArray {
    const data = new Uint8ClampedArray(imageData.data);
    const len = data.length;
    const histogram = new Array(256).fill(0);
    
    // Calculate histogram
    for (let i = 0; i < len; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      histogram[gray]++;
    }
    
    // Calculate cumulative histogram
    const cdf = new Array(256).fill(0);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i];
    }
    
    // Normalize CDF
    const cdfMin = cdf.find(x => x > 0) || 0;
    const cdfMax = cdf[255];
    const range = cdfMax - cdfMin;
    
    // Create lookup table
    const lut = new Array(256).fill(0);
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.round(((cdf[i] - cdfMin) / range) * 255);
    }
    
    // Apply histogram equalization and enhance contrast
    for (let i = 0; i < len; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      const enhanced = this.adjustContrast(lut[gray], 2.0); // Increased contrast factor
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }
    
    return data;
  }

  private adjustContrast(value: number, factor: number): number {
    return Math.min(255, Math.max(0, ((value - 128) * factor) + 128));
  }

  private calculateCentroid(points: Point2D[]): Point2D {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });

    return {
      x: Math.round(sum.x / points.length),
      y: Math.round(sum.y / points.length)
    };
  }

  private hasIntermediatePoints(p1: Point2D, p2: Point2D, edges: Point2D[]): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= 10) return true; // Points are close enough
    
    // Check for points between p1 and p2
    return edges.some(p => {
      if (p === p1 || p === p2) return false;
      
      // Check if point is roughly between p1 and p2
      const d1 = Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2);
      const d2 = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
      
      return d1 + d2 <= distance * 1.1; // Allow 10% tolerance
    });
  }
} 