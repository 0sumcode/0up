import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    wrapper: ({ children }) => (
      <article className="prose prose-invert mx-auto max-w-3xl px-6 py-12 lg:px-8">{children}</article>
    ),
    ...components,
  };
}
