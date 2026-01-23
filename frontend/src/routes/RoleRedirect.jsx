export const redirectByRole = (role) => {
  switch (role) {
    case "app-admin":
      return "/platform";
    case "tenant-admin":
      return "/tenant";
    case "driver":
      return "/driver";
    case "fleet-owner":
      return "/fleet-owner";
    case "rider":
      return "/rider";
    default:
      return "/login";
  }
};
