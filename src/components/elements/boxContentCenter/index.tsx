import Box from "@mui/material/Box";

export default function BoxContentCenter({ children }: any) {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: `calc(100vh - 630px)`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "560px", padding: "0 10px" }}>
        {children}
      </Box>
    </Box>
  );
}
