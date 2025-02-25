import { Transition } from '@headlessui/react';

const Projects = () => {
  const projects = [
    {
      title: "Project One",
      description: "A brief description of your first project",
      tech: ["React", "TypeScript", "Node.js"],
      link: "#"
    },
    {
      title: "Project Two",
      description: "A brief description of your second project",
      tech: ["Next.js", "TailwindCSS", "GraphQL"],
      link: "#"
    },
  ];

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="max-w-5xl mx-auto">
        <Transition
          appear={true}
          show={true}
          enter="transition-opacity duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          as="div"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-8">Projects</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <Transition
                key={index}
                appear={true}
                show={true}
                enter="transition-all duration-500 delay-[200ms]"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                as="div"
              >
                <a
                  href={project.link}
                  className="group block p-6 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-gray-400 mb-4">{project.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    {project.tech.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-2 py-1 text-sm rounded-md bg-gray-900/50"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </a>
              </Transition>
            ))}
          </div>
        </Transition>
      </div>
    </div>
  );
};

export default Projects;