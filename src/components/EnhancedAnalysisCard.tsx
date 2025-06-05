import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  ExpandMore,
  Warning,
  CheckCircle,
  Timeline,
  LocalHospital,
  Assignment,
  Schedule,
  Healing,
  LiveHelp,
} from '@mui/icons-material';
import { useTheme } from "@/lib/ThemeProvider";

interface EnhancedAnalysisCardProps {
  analysis: {
    refinedPrognosis: {
      status: string;
      explanation: string;
      riskFactors: string[];
      longTermOutlook: string;
    };
    detailedFindings: {
      primaryCondition: {
        description: string;
        severity: string;
        implications: string[];
      };
      secondaryFindings: Array<{
        condition: string;
        description: string;
        severity: string;
        implications: string[];
      }>;
      riskAssessment: {
        current: string;
        future: string;
        mitigationStrategies: string[];
      };
    };
    detailedTreatmentPlan: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
      preventiveMeasures: string[];
      lifestyle: string[];
    };
  };
}

const getSeverityColor = (severity: string, theme: Theme) => {
  const isDark = theme.palette.mode === 'dark';
  switch (severity.toLowerCase()) {
    case 'mild':
      return isDark ? '#81c784' : '#4CAF50';
    case 'moderate':
      return isDark ? '#ffb74d' : '#FF9800';
    case 'severe':
      return isDark ? '#e57373' : '#F44336';
    default:
      return isDark ? '#9e9e9e' : '#757575';
  }
};

const getPrognosisColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'good':
      return '#4CAF50';
    case 'fair':
      return '#FF9800';
    case 'poor':
    case 'questionable':
      return '#F44336';
    default:
      return '#757575';
  }
};

export const EnhancedAnalysisCard: React.FC<EnhancedAnalysisCardProps> = ({ analysis }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card 
      elevation={isDark ? 2 : 3} 
      className={`${isDark ? 'dark' : ''}`}
      sx={{ 
        mt: 4, 
        mb: 4, 
        borderRadius: 2,
        bgcolor: isDark ? 'rgb(24, 24, 27)' : '#ffffff',
        color: isDark ? 'rgb(250, 250, 250)' : 'inherit',
      }}
    >
      <CardContent>
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            color: isDark ? 'rgb(96, 165, 250)' : '#1976d2',
            fontWeight: 'bold' 
          }}
        >
          Enhanced Analysis Results
        </Typography>
        
        {/* Prognosis Section */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
            }}
          >
            <Assignment sx={{ color: isDark ? 'rgb(96, 165, 250)' : '#1976d2' }} /> Prognosis
          </Typography>
          <Alert 
            severity={analysis.refinedPrognosis.status.toLowerCase() === 'good' ? 'success' : 'warning'}
            sx={{ 
              mb: 2,
              bgcolor: isDark ? 'rgba(237, 108, 2, 0.1)' : undefined,
              border: isDark ? '1px solid rgba(237, 108, 2, 0.2)' : undefined,
              '& .MuiAlert-message': {
                color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
              }
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: isDark ? 'rgb(226, 232, 240)' : 'inherit' }}>
              Status: {analysis.refinedPrognosis.status}
            </Typography>
            {analysis.refinedPrognosis.explanation}
          </Alert>
          
          <Box sx={{ mt: 2 }}>
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ color: isDark ? 'rgb(148, 163, 184)' : 'inherit' }}
            >
              Risk Factors:
            </Typography>
            <Grid container spacing={1}>
              {analysis.refinedPrognosis.riskFactors.map((factor, index) => (
                <Grid item key={index}>
                  <Chip
                    label={factor}
                    color="error"
                    variant={isDark ? "filled" : "outlined"}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : undefined,
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : undefined,
                      '& .MuiChip-label': {
                        color: isDark ? 'rgb(252, 165, 165)' : undefined
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)' }} />

        {/* Primary Condition */}
        <Accordion 
          defaultExpanded
          sx={{
            bgcolor: isDark ? 'rgb(24, 24, 27)' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : undefined,
            '&.Mui-expanded': {
              margin: 0
            },
            '& .MuiAccordionSummary-root': {
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : undefined
            }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMore sx={{ color: isDark ? 'rgb(148, 163, 184)' : 'inherit' }} />}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
              }}
            >
              <LocalHospital sx={{ color: isDark ? 'rgb(239, 68, 68)' : '#d32f2f' }} /> Primary Condition
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Severity: ${analysis.detailedFindings.primaryCondition.severity}`}
                sx={{
                  bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#ef4444',
                  color: isDark ? 'rgb(252, 165, 165)' : '#ffffff',
                  mb: 2
                }}
              />
              <Typography 
                variant="body1" 
                paragraph
                sx={{ color: isDark ? 'rgb(226, 232, 240)' : 'inherit' }}
              >
                {analysis.detailedFindings.primaryCondition.description}
              </Typography>
              <List dense>
                {analysis.detailedFindings.primaryCondition.implications.map((imp, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning sx={{ color: isDark ? 'rgb(251, 191, 36)' : '#ed6c02' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={imp}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Treatment Plan */}
        <Accordion 
          defaultExpanded
          sx={{
            bgcolor: isDark ? 'rgb(24, 24, 27)' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : undefined,
            '&.Mui-expanded': {
              margin: 0
            },
            '& .MuiAccordionSummary-root': {
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : undefined
            }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMore sx={{ color: isDark ? 'rgb(148, 163, 184)' : 'inherit' }} />}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
              }}
            >
              <Timeline sx={{ color: isDark ? 'rgb(96, 165, 250)' : '#1976d2' }} /> Treatment Plan
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom
                  sx={{ 
                    color: isDark ? 'rgb(96, 165, 250)' : '#1976d2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Schedule /> Immediate Actions
                </Typography>
                <List dense>
                  {analysis.detailedTreatmentPlan.immediate.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: isDark ? 'rgb(34, 197, 94)' : '#2e7d32' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom
                  sx={{ 
                    color: isDark ? 'rgb(96, 165, 250)' : '#1976d2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Healing /> Long Term Care
                </Typography>
                <List dense>
                  {analysis.detailedTreatmentPlan.longTerm.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: isDark ? 'rgb(34, 197, 94)' : '#2e7d32' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Risk Assessment */}
        <Accordion
          sx={{
            bgcolor: isDark ? 'rgb(24, 24, 27)' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : undefined,
            '&.Mui-expanded': {
              margin: 0
            },
            '& .MuiAccordionSummary-root': {
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : undefined
            }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMore sx={{ color: isDark ? 'rgb(148, 163, 184)' : 'inherit' }} />}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
              }}
            >
              <LiveHelp sx={{ color: isDark ? 'rgb(251, 191, 36)' : '#ed6c02' }} /> Risk Assessment
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 2,
                bgcolor: isDark ? 'rgba(237, 108, 2, 0.1)' : undefined,
                border: isDark ? '1px solid rgba(237, 108, 2, 0.2)' : undefined,
                '& .MuiAlert-message': {
                  color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
                }
              }}
            >
              <Typography 
                variant="subtitle2" 
                gutterBottom
                sx={{ color: isDark ? 'rgb(251, 191, 36)' : '#ed6c02' }}
              >
                Current Risk:
              </Typography>
              {analysis.detailedFindings.riskAssessment.current}
            </Alert>
            <Alert 
              severity="info" 
              sx={{ 
                mb: 2,
                bgcolor: isDark ? 'rgba(2, 136, 209, 0.1)' : undefined,
                border: isDark ? '1px solid rgba(2, 136, 209, 0.2)' : undefined,
                '& .MuiAlert-message': {
                  color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
                }
              }}
            >
              <Typography 
                variant="subtitle2" 
                gutterBottom
                sx={{ color: isDark ? 'rgb(96, 165, 250)' : '#0288d1' }}
              >
                Future Outlook:
              </Typography>
              {analysis.detailedFindings.riskAssessment.future}
            </Alert>
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ color: isDark ? 'rgb(148, 163, 184)' : 'inherit' }}
            >
              Mitigation Strategies:
            </Typography>
            <List dense>
              {analysis.detailedFindings.riskAssessment.mitigationStrategies.map((strategy, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: isDark ? 'rgb(34, 197, 94)' : '#2e7d32' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={strategy}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: isDark ? 'rgb(226, 232, 240)' : 'inherit'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}; 