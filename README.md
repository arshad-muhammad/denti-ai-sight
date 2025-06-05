# Denti AI Sight

A sophisticated dental analysis application that leverages AI to provide comprehensive dental assessments and insights.

## Overview

Denti AI Sight is an advanced dental analysis platform that uses the Gemini API to analyze dental conditions and provide detailed assessments. The application processes dental information and generates structured analysis including primary conditions, secondary findings, risk assessments, and treatment recommendations.

## Features

- **AI-Powered Analysis**: Utilizes Google's Gemini API for intelligent dental assessments
- **Comprehensive Reports**: Generates detailed analysis including:
  - Primary condition identification
  - Secondary findings
  - Risk assessment
  - Treatment plan recommendations
- **Severity Classification**: Automatically categorizes conditions as mild, moderate, or severe
- **Real-time Processing**: Dynamic loading states and responsive UI
- **Error Handling**: Robust error management and fallback mechanisms

## Technical Stack

- Frontend: React/TypeScript
- AI Integration: Google Gemini API
- State Management: [Your state management solution]
- UI Framework: [Your UI framework]

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud API credentials for Gemini API

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
GEMINI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Usage

1. Access the application through your web browser
2. Input dental analysis requirements
3. Review the AI-generated comprehensive analysis
4. Access detailed findings and treatment recommendations

## Error Handling

The application implements comprehensive error handling:
- JSON parsing validation
- API response verification
- Fallback values for undefined fields
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
- [Other acknowledgments]
