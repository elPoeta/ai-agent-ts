import ora from "ora";

export const showLoader = (text: string) => {
  const spinner = ora({
    text,
    color: "cyan",
  }).start();

  return {
    stop: () => spinner.stop(),
    succeed: (text?: string) => spinner.succeed(text),
    fail: (text?: string) => spinner.fail(text),
    update: (text: string) => (spinner.text = text),
  };
};
