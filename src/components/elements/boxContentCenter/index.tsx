import Box from "@mui/material/Box";

export default function BoxContentCenter({ children }: any) {
  return (
    <Box
      sx={{
        width: "100%",
        height: `calc(100vh - 134px)`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box sx={{ width: "550px" }}>{children}</Box>
    </Box>
  );
}
