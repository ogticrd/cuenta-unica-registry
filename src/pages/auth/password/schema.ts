import { labels } from "@/constants/labels";
import * as yup from "yup";

export const schema = yup.object({
    password: yup.string().trim().required(labels.form.requiredField),
})
