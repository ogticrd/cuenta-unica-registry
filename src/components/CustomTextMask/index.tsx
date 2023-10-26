import { IMaskInput } from 'react-imask';
import { forwardRef } from 'react';

type CustomProps = {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
};

export const CustomTextMask: any = forwardRef<HTMLElement, CustomProps>(
  function CustomTextMask(props, ref: any) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask="000-0000000-0"
        inputRef={ref}
        onAccept={(value: string) =>
          onChange({ target: { name: props.name, value } })
        }
        overwrite
      />
    );
  },
);
