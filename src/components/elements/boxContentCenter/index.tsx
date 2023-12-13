import Box from '@mui/material/Box';

import styles from './styles.module.css';

export default function BoxContentCenter({ children }: any) {
  return (
    <Box className={styles.box_container}>
      <Box className={styles.box_content}>{children}</Box>
    </Box>
  );
}
