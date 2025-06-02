// Permite uso de <lottie-player> no JSX e métodos customizados no ref

declare namespace JSX {
  interface IntrinsicElements {
    'lottie-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      autoplay?: boolean;
      loop?: boolean;
      mode?: string;
      background?: string;
      speed?: string | number;
      style?: React.CSSProperties;
    };
  }
}

interface LottiePlayerElement extends HTMLElement {
  load: (data: string) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setLooping: (loop: boolean) => void;
} 