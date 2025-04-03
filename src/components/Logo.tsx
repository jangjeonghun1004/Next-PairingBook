import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  strokeWidth?: number;
  strokeColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({
  width = 72,
  height = 72,
  strokeWidth = 2,
  strokeColor = 'currentColor',
  className = '',
  style = {},
}) => {
  return (
    <svg
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      viewBox="0 0 72 72"
      preserveAspectRatio="xMidYMid meet"
    >
      <g>
        <g id="line">
          <path
            id="svg_2"
            d="m36,32.51c4.335,-4.336 8.841,-9.096 15.73,-9.096c7.226,0 12.24,5.271 12.24,12.58c-0.05592,7.058 -5.863,12.71 -12.92,12.58c-5.006,0 -8.99,-3.178 -12.47,-6.532m-2.581,-2.564c-4.335,4.335 -8.841,9.096 -15.73,9.096c-7.141,0 -12.24,-5.271 -12.24,-12.58c0.05558,-7.058 5.863,-12.71 12.92,-12.58c5.02,0 9.012,3.194 12.49,6.558m-3.476,3.475c-2.586,-2.503 -5.447,-4.932 -9.102,-4.932c-4.129,0.0055 -7.474,3.351 -7.48,7.48c-0.2047,4.113 3.108,7.542 7.226,7.48c4.844,0.0005 8.754,-4.166 11.98,-7.48m9.401,2.521c2.594,2.513 5.462,4.959 9.129,4.959c4.129,-0.0052 7.476,-3.351 7.482,-7.48l0.0004,0c0.2047,-4.113 -3.108,-7.542 -7.226,-7.48c-4.846,0 -8.756,4.165 -11.99,7.48"
            strokeWidth={strokeWidth + 0.5}
            strokeLinecap="round"
            fill="none"
            stroke={strokeColor}
          />
          <line
            fill="none"
            id="svg_3"
            strokeWidth={strokeWidth + 0.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            y2="32.51"
            y1="36"
            x2="36"
            x1="32.6"
            stroke={strokeColor}
          />
          <line
            fill="none"
            id="svg_4"
            strokeWidth={strokeWidth + 0.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            y2="36"
            y1="39.49"
            x2="39.4"
            x1="36"
            stroke={strokeColor}
          />
        </g>
      </g>
    </svg>
  );
};

export default Logo; 