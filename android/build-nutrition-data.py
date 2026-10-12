"""USDA SR28 abbreviated file: gram nutrients /100g, sodium mg /100g.
Source: https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR/SR28/dnload/sr28abbr.zip
Mappings are generic comparable foods, never asserted to be exact recipes.
Unmatched dishes remain unknown; no energy-based nutrient inference.
"""
import csv,json
from pathlib import Path
root=Path(__file__).parent
rows={r[0]:r for r in csv.reader((root/'nutrition-source/usda/ABBREV.txt').open(),delimiter='^',quotechar='~')}
groups={
 '主食':{0:'20053',1:'20037',4:'20038',7:'18075',8:'18069',9:'11168',11:'11367',12:'20115',13:'20121',14:'20137'},
 '蛋奶豆':{0:'01129',2:'01077',3:'01085',4:'01116',7:'16427',8:'16127',10:'11212',11:'16057'},
 '肉鱼虾':{0:'05064',1:'05098',3:'10061',4:'10005',5:'15237',6:'15269',7:'15271',8:'15121',9:'05140'},
 '蔬菜':{0:'11091',1:'11458',2:'11253',3:'11205',4:'11529',5:'11124',6:'11119',7:'11109',8:'11260',9:'11209',10:'11423',11:'11593',12:'11477',13:'11012',14:'11254'},
 '水果':dict(enumerate(['09003','09040','09200','09252','09132','09316','09050','09326','09148','09176','09266','09236','09037','09295'])),
 '坚果零食':{0:'12061',1:'12155',2:'16087',3:'12087',4:'12151',5:'19904',7:'18228',8:'09298',9:'19095'},
 '饮品调味':dict(enumerate(['14209','14278','14148','09206','14003','19296','19335','04053','04042','01001','16123','16098'])),
 '常见菜肴':{9:'01128',10:'05103'}
}
data={}
for group,items in groups.items():
 for i,ndb in items.items():
  r=rows[ndb]
  n={k:float(r[col]) if r[col] else None for k,col in [('carbs',7),('protein',4),('fat',5),('fiber',8),('sodium',15)]}
  data[group+str(i)]={'ndb':ndb,'description':r[1],'nutrients':n}
import runpy
runpy.run_path(str(root/'nutrition-supplement.py'))['supplement'](data, rows)
(root/'web/nutrition-data.js').write_text('// USDA SR28 generic food references; see build-nutrition-data.py.\nconst BUILTIN_NUTRITION='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f'Generated {len(data)} food references with provenance. All 103 foods have five nutrient values, with recipe assumptions recorded.')
