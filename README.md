# Living Portfolio Project Documentation

## Project Overview

A dynamic, evolving portfolio website built with Astro that demonstrates design abilities in action rather than just showcasing completed work. The site takes inspiration from Reboot Studio's clean, minimalist aesthetic while focusing on showing process and evolution.

## Technical Stack

- **Framework**: Astro
- **Styling**: Tailwind CSS
- **Content Management**: Astro Content Collections
- **Deployment**: Ready for Vercel/Netlify

## Project Structure

### Core Components

#### Layout & Global Components

- `Layout.astro` - Base layout with meta tags and global styles
- `Header.astro` - Responsive navigation with mobile menu
- `Footer.astro` - Contact information and social links

#### Homepage Components

- `Hero.astro` - Main introduction section
- `ProjectPreview.astro` - Grid of featured projects

#### Project Display Components

- `ImageCompare.astro` - Interactive slider to compare design versions

### Pages

- Homepage (`index.astro`) - Featured projects and introduction
- About (`about.astro`) - Design philosophy and background
- Work Listing (`work.astro`) - All projects grid view
- Project Detail (`work/[id].astro`) - Individual project with timeline

### Content Management

- Content Collections for projects (`src/content/projects/`)
- TypeScript interfaces for type safety
- JSON data files for each project

## Features Implemented

### Design System

- Minimalist approach with clean typography
- Limited color palette defined in Tailwind config
- Consistent spacing and component design
- Responsive layout for all screen sizes

### "Proof of Work" Section

- Project timeline visualization
- Version comparison with before/after slider
- Process documentation for each project stage
- Key learnings and decision points highlighted

### Technical Implementation

- TypeScript for type safety
- Responsive image handling
- Interactive components with accessibility considerations
- Mobile-first design approach

## Content Structure

### Project Schema

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  currentStage: string;
  startDate: Date;
  tags: string[];
  thumbnail: string;
  coverImage?: string;
  problemStatement?: string;
  versions?: Version[];
}

interface Version {
  versionNumber: string;
  date: Date;
  title: string;
  description: string;
  keyChanges: string[];
  designFiles: string[];
  learnings: string[];
}
```

## File Structure

```
├── public/
│   └── images/
│       ├── project-1.jpg
│       ├── project-2.jpg
│       ├── mobile-app/
│       └── brand-identity/
├── src/
│   ├── components/
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── ImageCompare.astro
│   │   └── ProjectPreview.astro
│   ├── content/
│   │   ├── config.ts
│   │   └── projects/
│   │       ├── mobile-app-redesign.json
│   │       └── brand-identity.json
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       ├── index.astro
│       ├── about.astro
│       ├── work.astro
│       └── work/
│           └── [id].astro
└── tailwind.config.mjs
```

## Next Steps

### For Content Enhancement

1. Add real project data with actual images
2. Enhance the version comparison with more examples
3. Improve placeholder images with real design artifacts

### For Feature Enhancement

1. Implement filterable projects by tag or category
2. Add animation for timeline entrance
3. Enhance the image comparison with notes/annotations
4. Add dark mode support

### For Deployment

1. Configure deployment settings for preferred platform
2. Set up proper image optimization
3. Ensure all placeholder content is replaced

## Commands to Run the Project

- Development: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
