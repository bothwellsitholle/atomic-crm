import { useFieldValue, useNotify, useTranslate } from "ra-core";
import { createRef, useCallback, useState } from "react";
import type { ReactCropperElement } from "react-cropper";
import { Cropper } from "react-cropper";
import { useDropzone } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import "cropperjs/dist/cropper.css";

import { rasterizeSvg } from "./rasterizeSvg";

const ImageEditorField = (props: ImageEditorFieldProps) => {
  const translate = useTranslate();
  const { getValues } = useFormContext();
  const source = getValues(props.source);
  const imageUrl = source?.src;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { type = "image", emptyText, linkPosition = "none" } = props;

  const commonProps = {
    src: imageUrl,
    onClick: () => setIsDialogOpen(true),
    style: { cursor: "pointer" },
    className: `${props.className || ""}`,
  };

  const width = props.width || (type === "avatar" ? 50 : 200);
  const height = props.height || (type === "avatar" ? 50 : 200);

  return (
    <>
      <div
        className={`flex ${
          linkPosition === "right" ? "flex-row" : "flex-col"
        } items-center ${linkPosition === "right" ? "gap-2" : "gap-1"}`}
      >
        <div
          className={`rounded ${props.backgroundImageColor ? "p-4" : "p-0"}`}
          style={{
            backgroundColor: props.backgroundImageColor || "transparent",
          }}
        >
          {props.type === "avatar" ? (
            <Avatar
              {...commonProps}
              className={`cursor-pointer`}
              style={{ width, height }}
            >
              <AvatarImage src={imageUrl} />
              <AvatarFallback>{emptyText}</AvatarFallback>
            </Avatar>
          ) : (
            <img
              {...commonProps}
              className="cursor-pointer object-cover"
              style={{ width, height }}
              alt={translate("crm.image_editor.editable_content", {
                _: "Editable content",
              })}
            />
          )}
        </div>
        {linkPosition !== "none" && (
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="text-xs underline hover:no-underline cursor-pointer text-center"
          >
            {translate("crm.image_editor.change")}
          </button>
        )}
      </div>
      <ImageEditorDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        {...props}
      />
    </>
  );
};

const ImageEditorDialog = (props: ImageEditorDialogProps) => {
  const translate = useTranslate();
  const notify = useNotify();
  const { setValue, handleSubmit } = useFormContext();
  const cropperRef = createRef<ReactCropperElement>();
  const initialValue = useFieldValue({ source: props.source });
  const [file, setFile] = useState<File | undefined>();
  const [imageSrc, setImageSrc] = useState<string | undefined>(
    initialValue?.src,
  );
  const notifyUnsupportedFile = useCallback(
    () => notify("crm.image_editor.unsupported_file", { type: "warning" }),
    [notify],
  );

  const onDrop = useCallback(
    async (files: File[]) => {
      const [droppedFile] = files;
      if (!droppedFile) return;
      try {
        const preview =
          droppedFile.type === "image/svg+xml"
            ? await rasterizeSvg(droppedFile)
            : URL.createObjectURL(droppedFile);
        setFile(droppedFile);
        setImageSrc(preview);
      } catch {
        notifyUnsupportedFile();
      }
    },
    [notifyUnsupportedFile],
  );

  const updateImage = async () => {
    const canvas = cropperRef.current?.cropper.getCroppedCanvas({
      minWidth: 256,
      minHeight: 256,
      maxWidth: 1024,
      maxHeight: 1024,
      imageSmoothingQuality: "high",
    });
    if (!canvas) return;
    // The cropper always exports PNG, whatever format was dropped
    const croppedImage = canvas.toDataURL("image/png");
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return;
    setImageSrc(croppedImage);

    const title = file?.name ?? initialValue?.title ?? "image.png";
    const croppedFile = new File([blob], title.replace(/\.[^.]*$/, ".png"), {
      type: "image/png",
    });
    setValue(
      props.source,
      {
        src: croppedImage,
        title,
        rawFile: croppedFile,
      },
      { shouldDirty: true },
    );
    props.onClose();

    if (props.onSave) {
      handleSubmit(props.onSave)();
    }
  };

  const deleteImage = () => {
    setValue(props.source, null, { shouldDirty: true });
    if (props.onSave) {
      handleSubmit(props.onSave)();
    }
    setImageSrc(undefined);
    props.onClose();
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
      "image/svg+xml": [".svg"],
    },
    onDrop,
    onDropRejected: notifyUnsupportedFile,
    multiple: false,
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onClose}>
      {props.type === "avatar" && (
        <style>
          {`
                        .cropper-crop-box,
                        .cropper-view-box {
                            border-radius: 50%;
                        }
                    `}
        </style>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {translate("crm.image_editor.title", {
              _: "Upload and resize image",
            })}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 justify-center">
          <div
            className="flex flex-col items-center gap-1 bg-muted/40 cursor-pointer p-4 border-2 border-dashed rounded-lg hover:bg-muted transition-colors"
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <p className="text-sm text-muted-foreground">
              {translate("crm.image_editor.drop_hint", {
                _: "Drop a file to upload, or click to select it.",
              })}
            </p>
            <p className="text-xs text-muted-foreground/80">
              {translate("crm.image_editor.accepted_formats", {
                _: "PNG, JPG, SVG, WebP or GIF",
              })}
            </p>
          </div>

          {imageSrc && (
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              aspectRatio={1}
              guides={false}
              cropBoxResizable={false}
            />
          )}
        </div>

        <DialogFooter className="flex justify-between w-full">
          <Button type="button" onClick={() => void updateImage()}>
            {translate("crm.image_editor.update_image")}
          </Button>
          <Button type="button" variant="destructive" onClick={deleteImage}>
            {translate("ra.action.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditorField;

export interface ImageEditorFieldProps {
  source: string;
  width?: number;
  height?: number;
  type?: "avatar" | "image";
  onSave?: any;
  linkPosition?: "right" | "bottom" | "none";
  backgroundImageColor?: string;
  className?: string;
  emptyText?: string;
}

export interface ImageEditorDialogProps extends ImageEditorFieldProps {
  open: boolean;
  onClose: () => void;
}
