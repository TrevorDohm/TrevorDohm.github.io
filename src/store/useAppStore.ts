import { create } from 'zustand'

interface Project {
  id: number
  title: string
  description: string
  achievements: string[]
  tags: string[]
  date: string
  location: string
}

interface Experience {
  id: number
  company: string
  role: string
  location: string
  duration: string
  achievements: string[]
}

interface AppState {
  selectedTag: string | null
  setSelectedTag: (tag: string | null) => void
  projects: Project[]
  experiences: Experience[]
  filteredProjects: Project[]
  filterProjects: (tag: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedTag: null,
  projects: [
    {
      id: 1,
      title: "Image Feature Extraction",
      description: "Project Leader at SMU",
      achievements: [
        "Achieved ~96% accuracy using ResNet50 feature extraction and classification in under 10 minutes of finetuning",
        "Employed DinoV2 ViTG for human-interpretable feature extraction, including dense matching and depth estimation",
        "Spearheaded project planning efforts through efficient task distribution among 3 group members and idea brainstorming"
      ],
      tags: ["Python", "PyTorch", "Machine Learning"],
      date: "Sep 2023",
      location: "SMU · Dallas, TX"
    },
    {
      id: 2,
      title: "Audio Filtering, FFT, Doppler Shifts",
      description: "Lead Developer at SMU",
      achievements: [
        "Executed real-time frequency analysis and FFT signal processing using iPhone Audio Card, Novocaine, and MetalGraph",
        "Attained over 99% accuracy rate in identifying distinct user gestures by effectively leveraging Doppler Shift calculation",
        "Enhanced overall performance by 20% through utilization of the Serial Queue for strategic block deployment"
      ],
      tags: ["Swift", "Signal Processing", "iOS"],
      date: "Sep 2023",
      location: "SMU · Dallas, TX"
    },
    {
      id: 3,
      title: "Cottention Transformer",
      description: "Codeveloper",
      achievements: [
        "Developed Transformer from scratch, utilizing an alternative attention matrix construction centering on similarity scores",
        "Currently training and benchmarking model on SMU NVIDIA DGX SuperPod HPC Cluster, comprising of 20 A100 nodes",
        "Collaborating with partner to enhance transformer modules through parallelization and code optimization for high efficiency"
      ],
      tags: ["Python", "PyTorch", "Deep Learning"],
      date: "Sep 2023",
      location: "Dallas, TX"
    }
  ],
  experiences: [
    {
      id: 1,
      company: "RTX",
      role: "Software Engineer",
      location: "Dallas, TX",
      duration: "Jan 2023 – Present",
      achievements: [
        "Implemented cutting-edge OCR with 750% increased speed and 10% improved accuracy over previous implementation",
        "Upgraded and refined code across 6 repositories, successfully incorporated into the official product release",
        "Utilized Atlassian suite of products in Agile work environment, resulting in enhanced collaboration and improved efficiency"
      ]
    },
    {
      id: 2,
      company: "Croquet",
      role: "Software Developer",
      location: "Los Angeles, CA",
      duration: "May 2022 – Dec 2022",
      achievements: [
        "Collaborated with 10 other engineers to design a range of metaverse worlds and objects complete with physics simulation",
        "Created crane simulation that was featured at company-wide meetings, shared with investors, and integral to customer demos",
        "Achieved daily deliverables amounting to over 1000 lines of code in the official Open-Source Croquet GitHub repository"
      ]
    }
  ],
  filteredProjects: [],
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  filterProjects: (tag) => 
    set((state) => ({
      filteredProjects: tag 
        ? state.projects.filter(project => project.tags.includes(tag))
        : state.projects
    }))
}))