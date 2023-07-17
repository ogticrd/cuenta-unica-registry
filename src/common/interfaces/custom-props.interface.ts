export interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}
