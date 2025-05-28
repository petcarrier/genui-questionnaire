# Website Comparison Questionnaire

A Next.js application for conducting website comparison evaluations across multiple dimensions with data export capabilities in standardized format.

## Features

- **Multi-dimensional Evaluation**: Compare websites across 7 key dimensions:
  - Query-Interface Consistency
  - Task Efficiency
  - Usability
  - Learnability
  - Information Clarity
  - Aesthetic or Stylistic Appeal
  - Interaction Experience Satisfaction

- **Progressive Questionnaire**: Step-by-step evaluation with progress tracking
- **Captcha Verification**: Simple math-based verification for each submission
- **Data Export**: Export evaluation data in standardized JSON format
- **Responsive Design**: Works on desktop and mobile devices

## Data Export Format

The application exports data in a standardized JSON format matching research evaluation requirements:

```json
[
  {
    "DataPoint_ID": "unique-uuid",
    "Task_Group_ID": "group-uuid",
    "Task_Type": "multiple_choice",
    "Question": "【Dimension Name】Description of evaluation criteria",
    "User query": "The original user query being evaluated",
    "Example 1 (Open the link in browser. See UI and copy verification code)": "URL1",
    "Example 2 (Open the link in browser. See UI and copy verification code)": "URL2",
    "Annotator1_ID": "annotator-id",
    "Annotator1_Response": "Example 1 better|Example 2 better|Tie",
    "Annotator1_Timestamp": "ISO-timestamp",
    "Annotator2_ID": "",
    "Annotator2_Response": "",
    "Annotator2_Timestamp": "",
    "url1_win_rate": 0.0-1.0,
    "url2_win_rate": 0.0-1.0,
    "details_appearances": 1,
    "dimension": "Dimension Name"
  }
]
```

## API Endpoints

- `GET /api/questionnaire/export` - Export actual submission data
- `GET /api/questionnaire/demo-export` - Download demo data in export format
- `POST /api/questionnaire/submit` - Submit questionnaire responses

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Start Questionnaire**: Click "Start Questionnaire" to begin evaluation
2. **Preview Export Format**: Click "Preview Export Format" to download sample data structure
3. **Complete Evaluations**: For each question, evaluate both examples across all 7 dimensions
4. **Verify with Captcha**: Complete the math captcha for each submission
5. **Export Data**: After completing all questions, use "Export Data" to download results

## Project Structure

```
src/
├── components/           # React components
├── data/                # Sample questions and configuration
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── pages/               # Next.js pages and API routes
│   ├── api/questionnaire/
│   │   ├── submit.ts    # Handle questionnaire submissions
│   │   ├── export.ts    # Export actual data
│   │   └── demo-export.ts # Export demo data
│   └── index.tsx        # Main application page
├── styles/              # CSS styles
└── types/               # TypeScript type definitions
```

## Development

The application uses:
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons

## Data Storage

Currently uses in-memory storage for demo purposes. For production use, integrate with:
- Database (PostgreSQL, MongoDB, etc.)
- Authentication system
- File storage for larger datasets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Notes

- Website previews use iframes with security sandbox attributes
- Some websites may block iframe embedding (X-Frame-Options)
- Fallback UI provided for non-embeddable sites
- All form data is validated both client and server-side
- Submissions are stored in memory for demo purposes (implement proper database for production)
