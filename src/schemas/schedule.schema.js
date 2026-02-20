import z from "zod/v3";

const scheduleSchema = z
  .object({
    studentId: z
      .string({ required_error: "Student ID is required" })
      .uuid("Student ID must be a valid UUID"),
    tutorId: z
      .string({ required_error: "Tutor ID is required" })
      .uuid("Tutor ID must be a valid UUID"),
    title: z
      .string({ required_error: "Title is required" })
      .max(100, "Title must not exceed 100 characters")
      .min(1, "Title cannot be empty"),
    type: z.enum(["VIRTUAL", "IN_PERSON"], {
      required_error: "Meeting type is required",
      invalid_type_error: "Type must be one of: VIRTUAL, IN_PERSON",
    }),
    date: z
      .string({ required_error: "Date is required" })
      .date("Date must be a valid date in YYYY-MM-DD format"),
    startTime: z
      .string({ required_error: "Start time is required" })
      .regex(
        /^([0-1]\d|2[0-3]):([0-5]\d)$/,
        "Start time must be in HH:MM format",
      ),
    endTime: z
      .string({ required_error: "End time is required" })
      .regex(
        /^([0-1]\d|2[0-3]):([0-5]\d)$/,
        "End time must be in HH:MM format",
      ),
    link: z
      .string()
      .url("Meeting link must be a valid URL")
      .optional()
      .nullable(),
    location: z
      .string()
      .min(1, "Location cannot be empty")
      .optional()
      .nullable(),
    note: z.string().optional().nullable(),
    isCompleted: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "VIRTUAL" && !data.link) return false;
      return true;
    },
    {
      message: "Meeting link is required for virtual meetings",
      path: ["link"],
    },
  )
  .refine(
    (data) => {
      if (data.type === "IN_PERSON" && !data.location) return false;
      return true;
    },
    {
      message: "Location is required for in-person meetings",
      path: ["location"],
    },
  )
  .refine(
    (data) => {
      const [startHour, startMin] = data.startTime.split(":").map(Number);
      const [endHour, endMin] = data.endTime.split(":").map(Number);
      const startTotal = startHour * 60 + startMin;
      const endTotal = endHour * 60 + endMin;
      return endTotal > startTotal;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export { scheduleSchema };
