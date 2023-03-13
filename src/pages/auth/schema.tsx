import { labels } from "@/constants/labels";
import * as yup from "yup";

const schema = yup.object({
    active: yup.object().shape({
        label: yup.string(),
        value: yup.string().required(labels.form.requiredField),
    }),
    category: yup.object().shape({
        label: yup.string(),
        value: yup.string().required(labels.form.requiredField),
    }),
    subCategory: yup.object().shape({
        label: yup.string(),
        value: yup.string().required(labels.form.requiredField),
    }),
    hierarchy: yup.object().shape({
        label: yup.string(),
        value: yup.string().required(labels.form.requiredField),
    }),
    title: yup.string().required(labels.form.requiredField).trim(),
    info: yup.string().required(labels.form.requiredField).trim(),
    // codeOne: yup.string().trim(),
    activity: yup.array().required(labels.form.requiredField).min(1, labels.form.requiredField),
})

export default schema