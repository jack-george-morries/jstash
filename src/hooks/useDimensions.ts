import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface DimensionsData {
  width: number;
  height: number;
  isLandscape: boolean;
}

export const useDimensions = (): DimensionsData => {
  const [dimensions, setDimensions] = useState<DimensionsData>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      isLandscape: width > height,
    };
  });

  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
      });
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    return () => subscription.remove();
  }, []);

  return dimensions;
};
