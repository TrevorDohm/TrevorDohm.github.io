export interface Link {
  label: string
  href: string
}

export interface Project {
  slug: string
  title: string
  blurb: string
  /** Longer detail, rendered as bullets. */
  points: string[]
  tags: string[]
  period: string
  context: string
  links: Link[]
  /** Featured projects render large, at the top. */
  featured?: boolean
  /** Set when the work is internal and has no public artifact. */
  closedSource?: boolean
}

export const projects: Project[] = [
  {
    slug: 'cottention',
    title: 'Cottention: Linear Transformers with Cosine Attention',
    blurb:
      'An attention mechanism that replaces softmax with cosine similarity, which gives it linear memory complexity in sequence length instead of quadratic. Published at Computing Conference 2025 and awarded Best Paper.',
    points: [
      'Rearranged the attention equation so that cosine similarity, unlike softmax, can be computed without materializing the full attention matrix.',
      'The formulation can be expressed as an RNN with a finite hidden state, giving constant memory usage at inference.',
      'Wrote custom CUDA kernels and profiled them with Nsight; evaluated on bidirectional BERT and causal GPT tasks with performance comparable to softmax attention.',
      'Built a petabyte-scale data collection and tokenization pipeline on a SLURM/HPC environment, distributing training across a 20-node NVIDIA DGX A100 SuperPOD.',
      'Published the resulting tokenized corpora on Hugging Face for open research use. They have ~6,600 downloads.',
    ],
    tags: ['PyTorch', 'CUDA', 'Triton', 'Transformers', 'HPC', 'Research'],
    period: 'Sep 2023 – May 2024',
    context:
      'Undergraduate research with Dr. Eric Larson, SMU. Coauthored with Gabriel Mongaras and Eric C. Larson.',
    links: [
      { label: 'Paper (arXiv)', href: 'https://arxiv.org/abs/2409.18747' },
      {
        label: 'Springer LNNS',
        href: 'https://link.springer.com/chapter/10.1007/978-3-031-92602-0_32',
      },
      { label: 'Code', href: 'https://github.com/gmongaras/Cottention_Transformer' },
      { label: 'Datasets', href: 'https://huggingface.co/TrevorDohm' },
    ],
    featured: true,
  },
  {
    slug: 'atlas',
    title: 'ATLAS — Enterprise Agentic AI Assistant',
    blurb:
      'An internal agentic AI platform built from scratch in under two months, deployed into a fully air-gapped environment with no external API access.',
    points: [
      'Deployed a 12B-parameter open-weight LLM with q8-quantized ONNX embeddings inside an air-gapped Kubernetes environment.',
      'Implemented 100+ agent tools spanning Jira, Confluence, PostgreSQL, Loki, and Prometheus.',
      'Directed a 4-person tiger team as technical lead, head designer, and scrum master.',
      'Drove adoption across development and test through 8 live demos and gated beta access, winning and renewing customer funding each release cycle.',
    ],
    tags: ['LLM Agents', 'Kubernetes', 'ONNX', 'Quantization', 'RAG'],
    period: '2026 – Present',
    context: 'RTX',
    links: [],
    featured: true,
    closedSource: true,
  },
  {
    slug: 'document-intelligence',
    title: 'Document Intelligence — OCR & Vision-Language Models',
    blurb:
      'A production document-understanding pipeline that replaced a CPU-bound OCR engine with a vision-language model, at roughly 10x the throughput.',
    points: [
      "Traced slow document processing to Tesseract's CPU-bound LSTM; built a CRNN proof of concept and won team buy-in to design it into the production pipeline.",
      'Took the system from CRNN prototype to a production PyTorch VLM inference pipeline, reaching roughly 10x throughput and ~25% accuracy gain over baseline.',
      'Benchmarked across synthetic and real-world datasets to quantify GPU requirements, securing investment and cloud GPU capacity now processing tens of thousands of documents monthly.',
    ],
    tags: ['PyTorch', 'VLM', 'OCR', 'CRNN', 'Inference'],
    period: '2023 – 2025',
    context: 'RTX',
    links: [],
    closedSource: true,
  },
  {
    slug: 'ml-infrastructure',
    title: 'ML Infrastructure & Cloud Migration',
    blurb:
      'Kubernetes architecture with GPU autoscaling and a full observability stack, now underpinning ATLAS across classified enclaves.',
    points: [
      'Drove AWS migration across 10+ classified enclaves, engineering EKS deployment architecture with GPU workload autoscaling.',
      'Stood up a Grafana/Prometheus/Loki observability stack now underpinning the ATLAS platform.',
      'Automated system onboarding from a multi-day manual setup to under 3 minutes.',
      'Parallelized a serialized service startup sequence, cutting boot time from 5 minutes to 7 seconds.',
    ],
    tags: ['AWS', 'Kubernetes', 'Grafana', 'Prometheus', 'GitLab CI/CD'],
    period: '2023 – Present',
    context: 'RTX',
    links: [],
    closedSource: true,
  },
  {
    slug: 'vit-from-scratch',
    title: 'Vision Transformer from Scratch',
    blurb:
      'A ViT implemented from first principles and trained on MNIST. Patch embedding, attention, and encoder all written by hand to learn the architecture end to end.',
    points: [
      'Implemented patch embedding, multi-head self-attention, and the full transformer encoder from scratch.',
      'Published as an open model on Hugging Face.',
    ],
    tags: ['PyTorch', 'Transformers', 'Computer Vision'],
    period: 'Mar 2024',
    context: 'Personal',
    links: [
      {
        label: 'Model',
        href: 'https://huggingface.co/TrevorDohm/ViT_Scratch_MNIST',
      },
    ],
  },
  {
    slug: 'bias-mitigation-lora',
    title: 'Bias Mitigation with LoRA',
    blurb:
      'A LoRA adapter that reduces model bias without retraining the full model.',
    points: [
      'Used low-rank adaptation to fine-tune for bias mitigation without full model retraining.',
      'Published as an open model on Hugging Face.',
    ],
    tags: ['LoRA', 'Fine-tuning', 'PyTorch', 'Responsible AI'],
    period: 'May 2024',
    context: 'Personal',
    links: [
      {
        label: 'Model',
        href: 'https://huggingface.co/TrevorDohm/Bias_Mitigation_LoRA',
      },
    ],
  },
  {
    slug: 'image-feature-extraction',
    title: 'Image Feature Extraction',
    blurb:
      'Transfer-learning classification reaching ~96% accuracy in under ten minutes of fine-tuning, alongside interpretable feature work with DINOv2.',
    points: [
      'Achieved ~96% accuracy using ResNet50 feature extraction and classification with under 10 minutes of fine-tuning.',
      'Used DINOv2 ViT-G for human-interpretable feature extraction, including dense matching and depth estimation.',
      'Led project planning and task distribution across a 3-person team.',
    ],
    tags: ['Python', 'PyTorch', 'Computer Vision'],
    period: 'Sep 2023',
    context: 'SMU',
    links: [],
  },
  {
    slug: 'audio-doppler-gestures',
    title: 'Gesture Recognition via Doppler Shift',
    blurb:
      'Real-time gesture recognition on iOS, classifying hand motion from Doppler shift measured with on-device FFT.',
    points: [
      'Implemented real-time frequency analysis and FFT signal processing using the iPhone audio card, Novocaine, and MetalGraph.',
      'Reached over 99% accuracy identifying distinct user gestures from Doppler shift calculation.',
      'Improved performance ~20% by moving block deployment onto a serial queue.',
    ],
    tags: ['Swift', 'iOS', 'Signal Processing', 'FFT'],
    period: 'Sep 2023',
    context: 'SMU',
    links: [],
  },
]
