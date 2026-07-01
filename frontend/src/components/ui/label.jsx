export const Label = ({ children, className = "", ...props }) => (
  <label 
    className={`text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} 
    {...props}
  >
    {children}
  </label>
);