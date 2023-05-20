import Box from "@mui/material/Box";

export default function BoxContentCenter({ children }: any) {
  return (
    <Box
      sx={{
        width: "100%",
        // height: `calc(100vh - 199px)`,
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
