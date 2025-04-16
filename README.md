# Mockr – AI-Powered Voice Interview Practice

An AI-powered interview practice platform that uses voice interactions to help candidates prepare for job interviews. Built with Next.js, TypeScript, TailwindCSS, and OpenAI's GPT-4.

## Features

- Resume upload and parsing with Ragie AI:
  - Intelligent document analysis
  - Content extraction and indexing
  - Semantic search capabilities
- Job description analysis
- Role-specific interview questions
- Real-time voice interactions with AI interviewer
- Volume visualization and audio feedback
- Comprehensive performance scoring
- Detailed feedback analysis including:
  - Technical knowledge assessment
  - Communication skills evaluation
  - Problem-solving capability scoring
- Professional development recommendations
- Interview time management (8-minute sessions)
- Modern, responsive UI with dark mode support

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with the required API keys:
   ```
   # Vapi Configuration
   NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key_here
   VAPI_ORG_ID=your_vapi_org_id_here
   VAPI_PRIVATE_KEY=your_vapi_private_key_here

   # Ragie Configuration
   RAGIE_API_KEY=your_ragie_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in your Vercel project settings:
   - `NEXT_PUBLIC_VAPI_API_KEY`
   - `VAPI_ORG_ID`
   - `VAPI_PRIVATE_KEY`
   - `RAGIE_API_KEY`
4. Deploy!

## Tech Stack

- Next.js 15.2+ (App Router)
- React 19
- TypeScript 5
- TailwindCSS 3.4
- shadcn/ui components
- Ragie AI for resume processing
- PDF.js for document parsing
- Vapi AI for voice interactions
- OpenAI GPT-4 for interview intelligence
- Radix UI primitives
- Lucide React icons
- React Hook Form for form management
- Zod for validation
- Next-themes for dark mode

## Development

### Project Structure
```
app/
├── components/     # React components
├── hooks/         # Custom React hooks
├── lib/          # Utility functions and API clients
├── api/          # API routes including Ragie integration
├── interview/    # Interview session page
├── feedback/     # Interview feedback page
└── page.tsx      # Landing page
```

### Key Components
- `VapiClient`: Handles voice interaction integration
- `FeedbackAnalysis`: Processes and displays interview results
- `VolumeIndicator`: Real-time audio visualization
- `TranscriptDisplay`: Shows interview transcription
- `FileUpload`: Handles resume upload and Ragie processing

### Styling
- TailwindCSS for styling
- CSS variables for theme customization
- Responsive design patterns
- Dark mode support

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 