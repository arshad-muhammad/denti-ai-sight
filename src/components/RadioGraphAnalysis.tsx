import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, MousePointer, Undo, Wand2 } from "lucide-react";
import { ImageProcessingService } from '@/services/imageProcessingService';
import { Point2D } from '@/types/dental';

interface RadioGraphAnalysisProps {
  imageUrl: string;
  onMeasurementsChange?: (measurements: {
    boneLossPercentage: number;
    cejY: number;
    boneY: number;
    apexY: number;
    periodontalStage: string;
  }) => void;
}

export const RadioGraphAnalysis = ({ imageUrl, onMeasurementsChange }: RadioGraphAnalysisProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [markingMode, setMarkingMode] = useState<'cej' | 'bone' | 'apex' | null>(null);
  const [points, setPoints] = useState<{ cej?: Point2D; bone?: Point2D; apex?: Point2D }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<{
    rootLength: string;
    boneLoss: string;
    cejToBone: string;
    periodontalStage: string;
  }>({
    rootLength: '0.0',
    boneLoss: '0.0',
    cejToBone: '0.0',
    periodontalStage: 'Not determined'
  });

  const imageProcessingService = ImageProcessingService.getInstance();

  // Add connection status check
  const checkConnection = async () => {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-store'
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Load and process the initial image
  useEffect(() => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    const loadImage = async (retryCount = 0) => {
      setIsProcessing(true);
      setWarnings([]);

      try {
        // Check internet connection first
        const isConnected = await checkConnection();
        if (!isConnected) {
          throw new Error('No internet connection available');
        }

        // Create a new image with crossOrigin set
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Image load timeout'));
          }, 30000); // 30 second timeout

          img.onload = () => {
            clearTimeout(timeoutId);
            console.log('Image loaded successfully:', {
              width: img.width,
              height: img.height,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight
            });
            resolve(null);
          };

          img.onerror = async (error) => {
            clearTimeout(timeoutId);
            console.error('Image load error:', error);
            
            if (retryCount < MAX_RETRIES) {
              console.log(`Retrying image load (${retryCount + 1}/${MAX_RETRIES})...`);
              setTimeout(() => {
                loadImage(retryCount + 1);
              }, RETRY_DELAY);
            } else {
              reject(new Error(`Failed to load image after ${MAX_RETRIES} retries`));
            }
          };

          // Add cache-busting parameter and timestamp to force reload
          const timestamp = Date.now();
          const cacheBuster = Math.random().toString(36).substring(7);
          const separator = imageUrl.includes('?') ? '&' : '?';
          img.src = `${imageUrl}${separator}v=${cacheBuster}&t=${timestamp}`;
        });

        // Store the image reference
        imageRef.current = img;

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // Set canvas size to match natural image size
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            setImageWidth(img.naturalWidth);
            setImageHeight(img.naturalHeight);

            // Clear canvas before drawing
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw grayscale image
            ctx.filter = 'grayscale(100%) contrast(120%)';
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';

            console.log('Canvas setup complete:', {
              canvasWidth: canvas.width,
              canvasHeight: canvas.height,
              imageWidth: img.width,
              imageHeight: img.height
            });

            // Try automatic detection
            handleAutoDetect();
          }
        }
      } catch (error) {
        console.error('Error in image loading process:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const isConnectionError = errorMessage.includes('internet connection') || 
                                errorMessage.includes('ERR_SOCKET_NOT_CONNECTED');
        
        setWarnings([
          isConnectionError ? 
            'No internet connection. Please check your connection and try again.' :
            'Error loading image. Please check the image URL and try again.',
          errorMessage
        ]);
        
        // Clear any partial state
        imageRef.current = null;
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            
            // Draw fallback message
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Image loading failed', canvasRef.current.width / 2, canvasRef.current.height / 2 - 10);
            ctx.fillText('Please check your internet connection', canvasRef.current.width / 2, canvasRef.current.height / 2 + 10);
          }
        }
      }
      setIsProcessing(false);
    };

    loadImage();

    // Cleanup function
    return () => {
      setIsProcessing(false);
      setWarnings([]);
      if (imageRef.current) {
        imageRef.current = null;
      }
    };
  }, [imageUrl]);

  // Function to handle automatic landmark detection
  const handleAutoDetect = async () => {
    if (!canvasRef.current || !imageRef.current) return;
    setIsProcessing(true);
    
    try {
      // Create a new canvas for processing
      const processCanvas = document.createElement('canvas');
      processCanvas.width = imageRef.current.width;
      processCanvas.height = imageRef.current.height;
      
      const processCtx = processCanvas.getContext('2d');
      if (!processCtx) throw new Error('Could not get processing context');

      // Draw the image onto the processing canvas
      processCtx.drawImage(imageRef.current, 0, 0);

      // Get image data for processing
      const imageData = processCtx.getImageData(0, 0, processCanvas.width, processCanvas.height);
      
      // Process the image and detect landmarks
      const result = await imageProcessingService.detectLandmarks(imageData);
      
      if (result.landmarks) {
        setPoints({
          cej: result.landmarks.cej,
          bone: result.landmarks.bone,
          apex: result.landmarks.apex
        });
      } else {
        setWarnings(prev => [...prev, ...result.warnings.map(w => w.message)]);
      }
    } catch (error) {
      console.error('Error detecting landmarks:', error);
      setWarnings(prev => [...prev, 'Error detecting landmarks. Please try manual marking.']);
    }
    
    setIsProcessing(false);
  };

  // Update canvas with points
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw base image
    ctx.filter = 'grayscale(100%) contrast(120%)';
    ctx.drawImage(imageRef.current, 0, 0);
    ctx.filter = 'none';

    // Draw measurement points with improved visibility
    const drawPoint = (point: Point2D, color: string, label: string) => {
      // Draw outer glow
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.arc(point.x, point.y, 18, 0, 2 * Math.PI);
      ctx.fill();

      // Draw point
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 5;
      ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw label background
      ctx.font = 'bold 32px Arial';
      const textMetrics = ctx.measureText(label);
      const padding = 16;
      const textWidth = textMetrics.width;
      const textHeight = 32;
      
      const gradient = ctx.createLinearGradient(
        point.x + 25 - padding,
        point.y - textHeight - padding,
        point.x + 25 - padding,
        point.y + padding
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      
      ctx.fillStyle = gradient;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillRect(
        point.x + 25 - padding,
        point.y - textHeight - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, point.x + 25, point.y);
    };

    // Draw connecting lines with improved visibility
    const drawLine = (start: Point2D, end: Point2D, color: string, label?: string) => {
      // Draw line glow
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 8;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Draw main line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Draw measurement label if provided
      if (label) {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        ctx.font = 'bold 28px Arial';
        const textMetrics = ctx.measureText(label);
        const padding = 14;

        const gradient = ctx.createLinearGradient(
          midX - textMetrics.width / 2 - padding,
          midY - 20 - padding,
          midX - textMetrics.width / 2 - padding,
          midY + 20 + padding
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          midX - textMetrics.width / 2 - padding,
          midY - 20 - padding,
          textMetrics.width + padding * 2,
          40 + padding * 2
        );

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, midY);
      }
    };

    // Draw region guides for debugging
    const drawRegionGuides = () => {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
      ctx.setLineDash([5, 5]);
      
      // Draw anatomical regions
      const drawRegion = (y: number, label: string) => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * y);
        ctx.lineTo(canvas.width, canvas.height * y);
        ctx.stroke();
        
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillText(label, 10, canvas.height * y - 5);
      };

      // Draw region boundaries
      drawRegion(0.35, 'CEJ Region');
      drawRegion(0.55, 'Bone Region');
      drawRegion(0.75, 'Apex Region');

      // Draw tooth width guides
      const centerX = canvas.width / 2;
      const maxWidth = canvas.width * 0.25;
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.15)';
      ctx.beginPath();
      ctx.moveTo(centerX - maxWidth, 0);
      ctx.lineTo(centerX - maxWidth, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX + maxWidth, 0);
      ctx.lineTo(centerX + maxWidth, canvas.height);
      ctx.stroke();

      // Reset line style
      ctx.setLineDash([]);

      // Draw detected edges and clusters if available
      if (imageRef.current && canvasRef.current) {
        const processCanvas = document.createElement('canvas');
        processCanvas.width = canvas.width;
        processCanvas.height = canvas.height;
        
        const processCtx = processCanvas.getContext('2d');
        if (processCtx) {
          processCtx.drawImage(imageRef.current, 0, 0);
          const imageData = processCtx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Get edges from image processing service
          imageProcessingService.detectLandmarks(imageData).then(result => {
            const debug = result.landmarks?.debug;
            if (debug) {
              // Draw all detected edges
              ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
              debug.edges.forEach(edge => {
                ctx.beginPath();
                ctx.arc(edge.x, edge.y, 2, 0, 2 * Math.PI);
                ctx.fill();
              });

              // Draw clusters in different colors
              debug.clusters.forEach((cluster, index) => {
                const hue = (index * 60) % 360;
                ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
                cluster.forEach(point => {
                  ctx.beginPath();
                  ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
                  ctx.fill();
                });
              });
            }
          });
        }
      }
    };

    // Draw lines between points with measurements
    if (points.cej && points.bone) {
      drawLine(
        points.cej, 
        points.bone, 
        'rgba(59, 130, 246, 0.9)', // Blue
        `${imageProcessingService.calculateDistance(points.cej, points.bone).toFixed(1)}mm`
      );
    }

    if (points.bone && points.apex) {
      drawLine(
        points.bone,
        points.apex,
        'rgba(34, 197, 94, 0.9)', // Green
        `${imageProcessingService.calculateDistance(points.bone, points.apex).toFixed(1)}mm`
      );
    }

    // Draw points with improved colors and labels
    if (points.cej) drawPoint(points.cej, '#3B82F6', 'CEJ'); // Blue
    if (points.bone) drawPoint(points.bone, '#22C55E', 'Bone'); // Green
    if (points.apex) drawPoint(points.apex, '#EF4444', 'Apex'); // Red

    // Draw region guides in debug mode
    if (isProcessing) {
      drawRegionGuides();
    }

  }, [points, imageRef.current, isProcessing]);

  // Update measurements when points change
  useEffect(() => {
    if (points.cej && points.bone && points.apex) {
      const PIXELS_PER_MM = 7;
      
      const cejY = points.cej.y / PIXELS_PER_MM;
      const boneY = points.bone.y / PIXELS_PER_MM;
      const apexY = points.apex.y / PIXELS_PER_MM;

      const cejToBone = imageProcessingService.calculateDistance(points.cej, points.bone) / PIXELS_PER_MM;
      const cejToApex = imageProcessingService.calculateDistance(points.cej, points.apex) / PIXELS_PER_MM;
      
      const boneLossPercentage = (cejToBone / cejToApex) * 100;
      const boneLossMM = cejToBone;

      // Determine periodontal stage based on clinical criteria
      let periodontalStage = 'Not determined';
      
      // Stage determination based on bone loss % and clinical attachment loss (CAL)
      if (boneLossPercentage < 15 && boneLossMM < 2) {
        periodontalStage = 'No Periodontitis';
      } 
      // Stage I: Early/Mild Periodontitis
      else if (boneLossPercentage <= 15 && boneLossMM <= 2) {
        periodontalStage = 'Stage I: Early Periodontitis\n• Bone Loss: ≤15%\n• CAL: 1-2mm';
      }
      // Stage II: Moderate Periodontitis
      else if (boneLossPercentage <= 33 && boneLossMM <= 3) {
        periodontalStage = 'Stage II: Moderate Periodontitis\n• Bone Loss: 15-33%\n• CAL: 3-4mm';
      }
      // Stage III: Severe Periodontitis
      else if ((boneLossPercentage > 33 && boneLossPercentage <= 50) || (boneLossMM > 3 && boneLossMM <= 5)) {
        periodontalStage = 'Stage III: Severe Periodontitis\n• Bone Loss: 33-50%\n• CAL: ≥5mm';
      }
      // Stage IV: Advanced Periodontitis
      else if (boneLossPercentage > 50 || boneLossMM > 5) {
        periodontalStage = 'Stage IV: Advanced Periodontitis\n• Bone Loss: >50%\n• CAL: ≥5mm\n• Risk of Tooth Loss';
      }

      // Update measurements with scaled values
      onMeasurementsChange?.({
        boneLossPercentage: Number(boneLossPercentage.toFixed(1)),
        cejY: Number(cejY.toFixed(1)),
        boneY: Number(boneY.toFixed(1)),
        apexY: Number(apexY.toFixed(1)),
        periodontalStage
      });

      setMeasurements({
        rootLength: cejToApex.toFixed(1),
        boneLoss: boneLossPercentage.toFixed(1),
        cejToBone: cejToBone.toFixed(1),
        periodontalStage
      });
    }
  }, [points, onMeasurementsChange]);

  // Handle canvas clicks
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!markingMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const point: Point2D = {
      x: x * scaleX,
      y: y * scaleY
    };

    setPoints(prev => ({
      ...prev,
      [markingMode]: point
    }));

    setMarkingMode(null);
  };

  // Add retry button
  const handleRetry = () => {
    setWarnings([]);
    setPoints({});
    if (imageUrl) {
      const timestamp = Date.now();
      const newUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      // Force reload by temporarily changing the URL
      const img = new Image();
      img.src = newUrl;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {warnings.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                {warnings.map((warning, index) => (
                  <div key={index}>{warning}</div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-4"
              >
                <Undo className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Radiograph Analysis</CardTitle>
            <CardDescription>Use auto-detection or manually mark anatomical landmarks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAutoDetect}
                      disabled={isProcessing}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Auto Detect
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Automatically detect landmarks
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={markingMode === 'cej' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMarkingMode('cej')}
                    >
                      <MousePointer className="w-4 h-4 mr-2" />
                      Mark CEJ
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Click to mark Cemento-Enamel Junction
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={markingMode === 'bone' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMarkingMode('bone')}
                    >
                      <MousePointer className="w-4 h-4 mr-2" />
                      Mark Bone
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Click to mark Bone Level
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={markingMode === 'apex' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMarkingMode('apex')}
                    >
                      <MousePointer className="w-4 h-4 mr-2" />
                      Mark Apex
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Click to mark Root Apex
                  </TooltipContent>
                </Tooltip>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPoints({})}
              >
                <Undo className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>

            <div className="relative">
              <canvas
                ref={canvasRef}
                id="annotated-radiograph"
                className="w-full h-auto border rounded-lg cursor-crosshair"
                onClick={handleCanvasClick}
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <div className="text-sm text-muted-foreground">Processing image...</div>
                  </div>
                </div>
              )}
            </div>

            {(points.cej || points.bone || points.apex) && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Measurements</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-muted-foreground">CEJ Position:</label>
                        <div className="text-lg font-medium">
                          {points.cej ? `${(points.cej.y / 7).toFixed(1)} mm` : 'Not marked'}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Bone Level:</label>
                        <div className="text-lg font-medium">
                          {points.bone ? `${(points.bone.y / 7).toFixed(1)} mm` : 'Not marked'}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Apex Position:</label>
                        <div className="text-lg font-medium">
                          {points.apex ? `${(points.apex.y / 7).toFixed(1)} mm` : 'Not marked'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Analysis</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-muted-foreground">Root Length:</label>
                        <div className="text-lg font-medium">
                          {measurements.rootLength} mm
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">CEJ to Bone:</label>
                        <div className="text-lg font-medium">
                          {measurements.cejToBone} mm
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Bone Loss:</label>
                        <div className="text-lg font-medium">
                          {measurements.boneLoss}%
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Periodontal Stage:</label>
                        <div className="text-lg font-medium whitespace-pre-line bg-muted-foreground/5 p-2 rounded-md">
                          {measurements.periodontalStage}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};