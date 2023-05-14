import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export const LoadingProgress = () => {
  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <CircularProgress color="info" />
    </Box>
  );
};
