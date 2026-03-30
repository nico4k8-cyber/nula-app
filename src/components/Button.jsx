import { COLORS, TYPOGRAPHY, SIZE, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../design-tokens';

/**
 * Переиспользуемая кнопка для ПАРАДОКС v2
 * Варианты: primary | secondary | tertiary | danger
 * Размеры: sm | base | lg
 */
export function Button({
  children,
  variant = 'primary',
  size = 'base',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const variantStyles = {
    primary: {
      backgroundColor: COLORS.primary[500],
      color: COLORS.neutral[0],
      borderColor: COLORS.primary[600],
      hoverBg: COLORS.primary[600],
      activeBg: COLORS.primary[700],
    },
    secondary: {
      backgroundColor: COLORS.neutral[100],
      color: COLORS.neutral[900],
      borderColor: COLORS.neutral[200],
      hoverBg: COLORS.neutral[200],
      activeBg: COLORS.neutral[300],
    },
    tertiary: {
      backgroundColor: COLORS.secondary[50],
      color: COLORS.secondary[600],
      borderColor: COLORS.secondary[200],
      hoverBg: COLORS.secondary[100],
      activeBg: COLORS.secondary[200],
    },
    danger: {
      backgroundColor: COLORS.error,
      color: COLORS.neutral[0],
      borderColor: '#dc2626',
      hoverBg: '#b91c1c',
      activeBg: '#991b1b',
    },
  };

  const sizeConfig = SIZE.button[size];
  const variant_config = variantStyles[variant];

  const buttonStyle = {
    // Layout
    width: fullWidth ? '100%' : 'auto',
    height: sizeConfig.height,
    padding: sizeConfig.padding,

    // Typography
    fontSize: sizeConfig.fontSize,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontFamily: TYPOGRAPHY.family.sans,
    lineHeight: TYPOGRAPHY.lineHeight.normal,

    // Colors
    backgroundColor: variant_config.backgroundColor,
    color: variant_config.color,
    border: `1px solid ${variant_config.borderColor}`,

    // Appearance
    borderRadius: BORDER_RADIUS.lg,
    boxShadow: SHADOWS.sm,

    // Behavior
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `background-color ${ANIMATIONS.duration.fast} ${ANIMATIONS.easing.easeInOut}`,

    // Touch
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',

    // Reset
    border: `1px solid transparent`,
    outline: 'none',

    ...style,
  };

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = (e) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = variant_config.hoverBg;
    }
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = variant_config.backgroundColor;
  };

  const handleMouseDown = (e) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = variant_config.activeBg;
    }
  };

  return (
    <button
      style={buttonStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
