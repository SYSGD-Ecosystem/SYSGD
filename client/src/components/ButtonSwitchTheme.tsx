"use client";

import { FC } from "react";
import { IoIosMoon, IoIosSunny } from "react-icons/io";
import IconButton, { VariantIconButton } from "./IconButton";
import useTheme from "../hooks/useTheme";

const ButtonSwitchTheme: FC = () => {
  const { toggleTheme, theme } = useTheme();

  return (
    <IconButton
      variant={VariantIconButton.dark}
      tooltip="Tema"
      Icon={theme === "dark" ? IoIosSunny : IoIosMoon}
      onClick={toggleTheme}
    />
  );
};

export default ButtonSwitchTheme;
