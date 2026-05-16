export interface MarkerOptions {
  id?: string;
  color?: string;
  size?: number;
  style?: 'pin' | 'dot' | 'pulse';
  label?: string;
  tooltip?: string;
  animation?: 'drop' | 'bounce' | 'fade';
  onClick?: () => void;
}

export interface ArcOptions {
  id?: string;
  color?: string;
  width?: number;
  animated?: boolean;
  dashArray?: number[];
  altitude?: number;
}

export interface RingOptions {
  color?: string;
  maxRadius?: number;
  duration?: number;
  rings?: number;
}

export interface FlightOptions {
  duration?: number;
  altitude?: number;
  mode?: 'spiral' | 'direct';
}

export interface MorphOptions {
  duration?: number;
}
