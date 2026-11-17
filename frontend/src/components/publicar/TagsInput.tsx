import { Plus, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  label?: string;
  placeholder?: string;
  tags: string[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onChangeTags: (tags: string[]) => void;
}

export default function TagsInput({
  label = "Tags *",
  placeholder = "Ej. diseño, logotipo",
  tags,
  inputValue,
  onInputChange,
  onChangeTags,
}: Props) {
  const agregarDesdeTexto = (raw: string) => {
    const nuevos = raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && !tags.includes(t));

    if (nuevos.length > 0) {
      onChangeTags([...tags, ...nuevos]);
    }
    onInputChange("");
  };

  const eliminarTag = (tagToRemove: string) => {
    onChangeTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-700 block">{label}</Label>

      <div className="flex gap-1.5">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              agregarDesdeTexto(inputValue);
            }
          }}
          placeholder={placeholder}
          className="flex-1 h-9 bg-white border-slate-300 text-xs text-slate-900"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => agregarDesdeTexto(inputValue)}
          className="h-9 px-2.5 text-xs border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-medium"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
              <button
                type="button"
                onClick={() => eliminarTag(tag)}
                className="text-indigo-400 hover:text-rose-600 cursor-pointer"
                title="Quitar tag"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
