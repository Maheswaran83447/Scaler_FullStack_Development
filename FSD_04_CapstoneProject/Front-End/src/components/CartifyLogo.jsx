const CartifyLogo = ({ width = 280, height = 80, className = "", style }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 320 80"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-labelledby="cartify-logo-title cartify-logo-desc"
    preserveAspectRatio="xMidYMid meet"
    className={className}
    style={{ display: "block", ...style }}
  >
    <title id="cartify-logo-title">
      Cartify geometric diagonal basket logo
    </title>
    <desc id="cartify-logo-desc">
      A geometric cart with diagonal basket lines and a clean sans-serif
      wordmark.
    </desc>
    <g transform="translate(18 0)">
      <g
        fill="none"
        stroke="#163D7A"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 26c10-2 24-2 36 0l-4 18c-1 4-3 6-7 6H32" />
        <line x1="52" y1="26" x2="64" y2="40" />
        <line x1="48" y1="26" x2="60" y2="40" />
        <line x1="44" y1="26" x2="56" y2="40" />
        <circle cx="34" cy="52" r="4" fill="#163D7A" stroke="none" />
        <circle cx="48" cy="52" r="4" fill="#163D7A" stroke="none" />
        <path d="M12 22h8" />
        <path d="M12 22l7 22h32" />
      </g>
      <text
        x="102"
        y="56"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="32"
        fill="#163D7A"
        letterSpacing="0.1"
      >
        Cartify
      </text>
    </g>
  </svg>
);

export default CartifyLogo;
