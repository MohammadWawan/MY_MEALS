import json

file_path = r'd:\\MY MEALS\\src\\app\\admin\\menu\\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add nutrition to initial form state
content = content.replace(
    'category: "Paket",\n     menuType: "customer"\n  });',
    'category: "Paket",\n     menuType: "customer",\n     nutrition: [] as {indicator: string, value: string}[]\n  });'
)

# 2. Add nutrition helper functions before handleImageUpload
helpers = """
  const addNutritionRow = () => setForm(f => ({ ...f, nutrition: [...f.nutrition, {indicator: "", value: ""}] }));
  const updateNutrition = (index: number, field: "indicator" | "value", val: string) => {
     const newNutri = [...form.nutrition];
     newNutri[index][field] = val;
     setForm(f => ({ ...f, nutrition: newNutri }));
  };
  const removeNutritionRow = (index: number) => {
     const newNutri = form.nutrition.filter((_, i) => i !== index);
     setForm(f => ({ ...f, nutrition: newNutri }));
  };
"""
content = content.replace('const handleImageUpload', helpers + '\n  const handleImageUpload')

# 3. Update addMenu and updateMenu to include nutrition
content = content.replace(
    'menuType: form.menuType\n             });\n             toast.success("Menu updated',
    'menuType: form.menuType,\n                 nutrition: JSON.stringify(form.nutrition)\n             });\n             toast.success("Menu updated'
)
content = content.replace(
    'menuType: form.menuType\n             });\n             toast.success("Menu added',
    'menuType: form.menuType,\n                nutrition: JSON.stringify(form.nutrition)\n             });\n             toast.success("Menu added'
)

# 4. Handle setForm reset
content = content.replace(
    'setForm({ name: "", description: "", price: "", ImageUrl: "", category: "Paket", menuType: "customer" });',
    'setForm({ name: "", description: "", price: "", ImageUrl: "", category: "Paket", menuType: "customer", nutrition: [] });'
)

# 5. handleEdit update
handle_edit_old = """      setForm({
          name: menu.name,
          description: menu.description || "",
          price: menu.price.toString(),
          category: menu.category,
          ImageUrl: menu.imageUrl || "",
          menuType: menu.menuType
      });"""

handle_edit_new = """      let parsedNutrition = [];
      try {
        if (menu.nutrition) parsedNutrition = JSON.parse(menu.nutrition);
      } catch(e){}
      setForm({
          name: menu.name,
          description: menu.description || "",
          price: menu.price.toString(),
          category: menu.category,
          ImageUrl: menu.imageUrl || "",
          menuType: menu.menuType,
          nutrition: parsedNutrition
      });"""
content = content.replace(handle_edit_old, handle_edit_new)

# 6. Insert Nutrition UI before Description UI
nutrition_ui = """
               <div>
                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Nutrition Facts (Optional)</label>
                 {form.nutrition.map((n, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                       <input type="text" placeholder="Indicator (e.g. Calories)" value={n.indicator} onChange={e => updateNutrition(idx, 'indicator', e.target.value)} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                       <input type="text" placeholder="Value (e.g. 250 kcal)" value={n.value} onChange={e => updateNutrition(idx, 'value', e.target.value)} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                       <button type="button" onClick={() => removeNutritionRow(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><XCircle className="w-5 h-5"/></button>
                    </div>
                 ))}
                 <button type="button" onClick={addNutritionRow} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1"><Plus className="w-3 h-3"/> Add Nutrition Info</button>
               </div>
"""

content = content.replace(
    '<div>\n                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Description</label>',
    nutrition_ui + '\n               <div>\n                 <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Description</label>'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)


# ORDER PAGE UPDATES
order_file = r'd:\\MY MEALS\\src\\app\\order\\page.tsx'
with open(order_file, 'r', encoding='utf-8') as f:
    order_content = f.read()

# background fixes for light mode
order_content = order_content.replace('bg-[#0a0a0a]', 'bg-zinc-50 dark:bg-[#0a0a0a]')
order_content = order_content.replace('text-zinc-100 flex flex-col', 'text-black dark:text-zinc-100 flex flex-col')
order_content = order_content.replace('from-white to-zinc-500', 'from-zinc-900 dark:from-white to-zinc-500')
order_content = order_content.replace('bg-zinc-900 border border-zinc-800', 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800')
order_content = order_content.replace('bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800/50', 'bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800/50')
order_content = order_content.replace('bg-zinc-950', 'bg-zinc-100 dark:bg-zinc-950')
order_content = order_content.replace('text-white', 'text-black dark:text-white')

# We need to process nutrition in order detail modal
nutrition_render = """
                 <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed mb-6">{selectedItem.description}</p>

                 {selectedItem.nutrition && (() => {
                    let parsed = [];
                    try { parsed = JSON.parse(selectedItem.nutrition); } catch(e){}
                    if (parsed.length === 0) return null;
                    return (
                       <div className="mb-10 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                          <h4 className="text-sm font-black text-black dark:text-white mb-3 uppercase tracking-widest">Nutrition Facts</h4>
                          <div className="grid grid-cols-2 gap-4">
                             {parsed.map((n: any, idx: number) => (
                                <div key={idx} className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                   <span className="text-zinc-600 dark:text-zinc-400 text-sm font-bold">{n.indicator}</span>
                                   <span className="text-black dark:text-white text-sm font-black">{n.value}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    );
                 })()}
"""

order_content = order_content.replace('<p className="text-zinc-400 text-lg leading-relaxed mb-10">{selectedItem.description}</p>', nutrition_render)

with open(order_file, 'w', encoding='utf-8') as f:
    f.write(order_content)

print("Done")
