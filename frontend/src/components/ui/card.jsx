//Este es para la estructura de la tarjeta
import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'p-5',
  hover = true,
  onClick,
  as: Component = 'div',
  ...props
}) => {
  const interactive = Boolean(onClick);

  const classes = [
    'bg-white',
    'rounded-3xl',
    'border',
    'border-slate-200/80',
    'shadow-sm',
    padding,
    hover
      ? 'transition-all duration-200 hover:shadow-md hover:border-indigo-200'
      : '',
    interactive
      ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      className={classes}
      onClick={onClick}
      {...(interactive && Component === 'div'
        ? { role: 'button', tabIndex: 0 }
        : {})}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
