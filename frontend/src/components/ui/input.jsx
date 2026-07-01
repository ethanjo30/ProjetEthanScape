export const Input = ({ className = "", ...props }) => (
  <input className={`border p-2 rounded-md bg-transparent ${className}`} {...props} />
);