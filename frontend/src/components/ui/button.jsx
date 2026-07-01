export const Button = ({ children, className = "", ...props }) => (
  <button className={`px-4 py-2 bg-primary text-black rounded-md ${className}`} {...props}>
    {children}
  </button>
);