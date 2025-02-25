import { Link, useLocation } from "react-router-dom";
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const Navigation = () => {
  const location = useLocation();
  const links = [
    { path: "/", label: "About" },
    { path: "/projects", label: "Projects" },
    { path: "/blog", label: "Blog" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-semibold hover:opacity-80 transition-opacity">
            Trevor Dohm
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative py-1 transition-colors ${
                  location.pathname === link.path
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex justify-center p-2 text-gray-400 hover:text-white">
                <span className="sr-only">Open menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-1 py-1">
                    {links.map((link) => (
                      <Menu.Item key={link.path}>
                        {({ active }) => (
                          <Link
                            to={link.path}
                            className={`${
                              active ? 'bg-gray-700' : ''
                            } ${
                              location.pathname === link.path ? 'text-white' : 'text-gray-400'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            {link.label}
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;