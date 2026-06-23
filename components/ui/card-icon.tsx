export const CardIcon = ({
  color,
  dotColor = "#6db0e2",
  textColor = "white",
  className = "",
  delay = 0,
  duration = 4,
}: {
  color: string;
  dotColor?: string;
  textColor?: string;
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <svg
    aria-hidden="true"
    width="100%"
    height="100%"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`animate-disappear-appear ${className}`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
    preserveAspectRatio="none"
  >
    <path d="M47.7736 0V47.7677H0V7.3673L7.36712 0H47.7736Z" fill={color} />
    <path
      d="M23.3907 39.0056C16.4039 38.745 10.9736 32.7793 10.9736 25.7853V22.2636C10.9736 21.024 11.9808 20.0098 13.2274 20.0098H34.5541C35.7937 20.0098 36.8008 21.017 36.8008 22.2636V26.1022C36.8008 33.3921 30.7367 39.2873 23.3907 39.0056ZM15.4742 24.5104V25.8557C15.4742 30.3846 18.9465 34.2795 23.4682 34.5049C28.2998 34.7444 32.3073 30.8846 32.3073 26.1022V24.5104H15.4812H15.4742Z"
      fill={textColor}
    />
    <path
      d="M22.9749 15.0517H14.1005C12.537 15.0517 11.1354 13.9036 10.9875 12.3471C10.8184 10.5581 12.22 9.05078 13.9738 9.05078H22.8481C24.4117 9.05078 25.8133 10.1988 25.9612 11.7554C26.1302 13.5444 24.7286 15.0517 22.9749 15.0517Z"
      fill={textColor}
    />
    <path
      d="M35.8148 14.439C34.4977 15.7561 32.3566 15.7561 31.0396 14.439C29.7225 13.1219 29.7225 10.9807 31.0396 9.66361C32.3566 8.34651 34.4977 8.34651 35.8148 9.66361C37.1319 10.9807 37.1319 13.1219 35.8148 14.439Z"
      fill={dotColor}
    />
  </svg>
);
