import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ToothType } from '@/types/dental';

interface ToothSelectorProps {
  selectedTooth?: number;
  onToothSelect: (toothNumber: number) => void;
  measurements?: Record<number, { boneLoss: number; stage: string }>;
}

// Simplified tooth type mapping based on position in quadrant
export const getToothType = (toothNumber: number): ToothType => {
  // Convert tooth number to position in quadrant (1-8)
  const positionInQuadrant = ((toothNumber - 1) % 8) + 1;
  
  if (positionInQuadrant <= 2) return 'molar';
  if (positionInQuadrant <= 4) return 'premolar';
  if (positionInQuadrant === 5) return 'canine';
  return 'incisor';
};

const getSeverityColor = (boneLoss: number) => {
  if (boneLoss < 15) return 'bg-green-100 hover:bg-green-200';
  if (boneLoss < 33) return 'bg-yellow-100 hover:bg-yellow-200';
  if (boneLoss <= 50) return 'bg-orange-100 hover:bg-orange-200';
  return 'bg-red-100 hover:bg-red-200';
};

export const ToothSelector = ({ selectedTooth, onToothSelect, measurements = {} }: ToothSelectorProps) => {
  const [hoveredQuadrant, setHoveredQuadrant] = useState<number | null>(null);

  const renderTooth = (number: number, isLower: boolean) => {
    // Convert to internal numbering system (1-16)
    const internalNumber = isLower ? number + 8 : number;
    const measurement = measurements[internalNumber];
    const isSelected = selectedTooth === internalNumber;
    const quadrant = isLower ? 2 : 1;
    const isHovered = hoveredQuadrant === quadrant;

    return (
      <Tooltip key={internalNumber}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'w-8 h-8 p-0 relative',
              isSelected && 'ring-2 ring-primary',
              measurement ? getSeverityColor(measurement.boneLoss) : 'bg-background',
              isHovered && 'scale-110 transition-transform'
            )}
            onClick={() => onToothSelect(internalNumber)}
            onMouseEnter={() => setHoveredQuadrant(quadrant)}
            onMouseLeave={() => setHoveredQuadrant(null)}
          >
            {number}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div>Tooth #{number} ({getToothType(internalNumber)})</div>
            {measurement && (
              <>
                <div>Bone Loss: {measurement.boneLoss.toFixed(1)}%</div>
                <div>Stage: {measurement.stage}</div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Upper Teeth (1-8) */}
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 8 }, (_, i) => renderTooth(i + 1, false))}
            </div>
            
            <div className="h-px bg-border" />
            
            {/* Lower Teeth (1-8) */}
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 8 }, (_, i) => renderTooth(i + 1, true))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}; 