# Denti AI Sight

A sophisticated dental analysis application that leverages AI to provide comprehensive dental assessments and insights.

## Overview

Denti AI Sight is an advanced dental analysis platform that uses the Gemini API to analyze dental conditions and provide detailed assessments. The application processes dental radiographs, clinical measurements, and patient data to generate comprehensive analysis including primary conditions, secondary findings, risk assessments, and treatment recommendations.

## Features

### Core Analysis Features
- **AI-Powered Analysis**: Utilizes Google's Gemini API for intelligent dental assessments
- **Comprehensive Reports**: Generates detailed analysis including:
  - Primary condition identification
  - Secondary findings
  - Risk assessment
  - Treatment plan recommendations
- **Severity Classification**: Automatically categorizes conditions as mild, moderate, or severe
- **Real-time Processing**: Dynamic loading states and responsive UI
- **Error Handling**: Robust error management and fallback mechanisms

### New Features
- **Dark Theme Support**: Complete dark mode implementation with proper contrast and accessibility
- **Enhanced Analysis Card**: 
  - Detailed periodontal analysis
  - Bone loss measurements and visualization
  - Clinical implications and risk factors
- **Interactive Radiograph Analysis**:
  - Manual measurement tools
  - Automatic bone loss calculation
  - Region marking and annotation
- **Comprehensive PDF Reports**:
  - Patient information and medical history
  - Detailed analysis results
  - Original and marked radiographs
  - Treatment recommendations
  - Clinical measurements
- **Clinical Data Integration**:
  - Bleeding on Probing (BoP) assessment
  - Periodontal measurements
  - Risk factor analysis
- **Real-time Updates**:
  - Live analysis progress tracking
  - Automatic data synchronization
  - Rate limit handling with automatic retries

### UI/UX Improvements
- **Responsive Design**: Optimized for all screen sizes
- **Theme Integration**: Seamless Material-UI and custom theme synchronization
- **Progress Tracking**: Visual feedback for analysis stages
- **Enhanced Error Handling**: User-friendly error messages and recovery options

## Technical Stack

- **Frontend**: React with TypeScript
- **UI Frameworks**: 
  - Material-UI (MUI)
  - Tailwind CSS
  - Shadcn/ui components
- **State Management**: React Context API
- **AI Integration**: 
  - Google Gemini API
  - Custom AI service layer
- **Database**: Supabase
- **Image Processing**: HTML Canvas API
- **PDF Generation**: jsPDF with AutoTable

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud API credentials for Gemini API
- Supabase account and credentials

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd denti-ai-sight
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
Create a `.env` file in the root directory and add:
```
VITE_GEMINI_API_KEY=your_api_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Usage

1. Access the application through your web browser
2. Upload a dental radiograph
3. Input patient information and clinical data
4. Review the AI-generated comprehensive analysis
5. Use the interactive tools for measurements
6. Generate and download detailed PDF reports

## Error Handling

The application implements comprehensive error handling:
- Rate limiting with exponential backoff
- Automatic retries for API failures
- Fallback analysis when AI service is unavailable
- Validation for all user inputs
- Graceful degradation of features
- User-friendly error messages

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

[Your chosen license]

## Support

For support, please [contact information or link to issues]

## Acknowledgments

- Google Gemini API
- Material-UI Team
- Shadcn/ui
- Supabase
- jsPDF
