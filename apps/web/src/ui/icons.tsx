const Svg = ({ d, children }: { d?: string; children?: React.ReactNode }) => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);
export const HomeIcon = () => <Svg d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z" />;
export const WordsIcon = () => <Svg d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM9 9h6M9 13h4" />;
export const TimerIcon = () => (
  <Svg>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9v4l2.5 2.5M9.5 3h5" />
  </Svg>
);
export const ChartIcon = () => <Svg d="M4 19V11M10 19V5M16 19v-6M22 19H2" />;
export const CloseIcon = () => <Svg d="M6 6l12 12M18 6 6 18" />;
export const BackIcon = () => <Svg d="M15 5l-7 7 7 7" />;
export const GridIcon = () => <Svg d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />;
