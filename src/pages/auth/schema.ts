import { labels } from "@/constants/labels";
import * as yup from "yup";

export const schema = yup.object({
    cedulaOrEmail: yup.string().trim().required(labels.form.requiredField),
})
