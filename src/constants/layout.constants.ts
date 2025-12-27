export const COLUMN_COUNT = 2;
export const SPACING = 4;
export const IMAGES_PER_PAGE = 20;

export const getItemWidth = (screenWidth: number) => {
  return (screenWidth - (COLUMN_COUNT + 1) * SPACING) / COLUMN_COUNT;
};
