"""Explicit reference recipes. Ingredient grams and final yield are assumptions,
not measured recipes. Nutrients are calculated from USDA SR28 ingredient rows.
"""
def supplement(data, rows):
    cols={'carbs':7,'protein':4,'fat':5,'fiber':8,'sodium':15}
    def direct(key,ndb,note='同类食物参考'):
        r=rows[ndb]
        data[key]={'ndb':ndb,'description':r[1],'method':'reference','note':note,'nutrients':{k:float(r[c]) if r[c] else None for k,c in cols.items()}}
    for key,ndb,note in [
      ('主食5','20121','以无盐熟小麦面食作为同类参考'),('主食10','11510','以水煮去皮红薯作为蒸红薯的近似参考'),
      ('蛋奶豆1','01124','以鲜蛋白作为参考，假设水煮前后重量相近'),('蛋奶豆5','01119','以低脂香草甜味酸奶作为同类参考'),
      ('蛋奶豆6','16222','以无糖豆奶作为同类参考，品牌和浓度可能不同'),('肉鱼虾2','13454','以烤瘦牛上腰肉作为参考'),
      ('肉鱼虾10','17014','以烤瘦羊腿肉作为参考'),('坚果零食6','19411','以原味含盐薯片作为参考'),('常见菜肴11','21299','以普通饼底芝士披萨作为参考')]:direct(key,ndb,note)
    def recipe(key,description,ingredients,yield_g=100):
        nutrients={k:0.0 for k in cols}
        for ndb,grams in ingredients:
            for k,c in cols.items():
                assert rows[ndb][c]!='',(key,ndb,k)
                nutrients[k]+=float(rows[ndb][c])*grams/yield_g
        data[key]={'method':'recipe','description':description,'yieldGrams':yield_g,'ingredients':[{'ndb':n,'grams':g,'description':rows[n][1]} for n,g in ingredients],'nutrients':{k:round(v,2) for k,v in nutrients.items()}}
    recipe('主食2','12 克干小米加水煮至 100 克粥',[('20031',12)])
    recipe('主食3','23 克熟米饭加水煮至 100 克粥',[('20045',23)])
    recipe('主食6','60 克面粉加水蒸至 100 克馒头；不加糖油',[('20081',60)])
    recipe('主食15','60 克米粉加水蒸至 100 克年糕',[('20061',60)])
    recipe('蛋奶豆9','150 克硬豆腐压制至 100 克豆腐干；不另加盐',[('16126',150)])
    recipe('蔬菜15','8 克干木耳泡发沥水至 100 克',[('11988',8)])
    recipe('常见菜肴0','番茄 65 克、熟鸡蛋 30 克、油 5 克、盐 0.3 克；成品 100 克',[('11529',65),('01129',30),('04053',5),('02047',.3)])
    recipe('常见菜肴1','熟鸡胸 50 克、花生 8 克、黄瓜 25 克、油 5 克、糖 3 克、酱油 5 克；加水至成品 100 克',[('05064',50),('16087',8),('11205',25),('04042',5),('19335',3),('16123',5)])
    recipe('常见菜肴2','生五花肉 70 克、糖 5 克、酱油 5 克；加水炖至成品 100 克，假设汤汁和脂肪全部保留',[('10005',70),('19335',5),('16123',5)])
    recipe('常见菜肴3','白菜 95 克、油 5 克、盐 0.3 克；成品 100 克',[('11119',95),('04053',5),('02047',.3)])
    recipe('常见菜肴4','熟米饭 75 克、熟鸡蛋 15 克、胡萝卜 5 克、油 5 克、盐 0.3 克；成品 100 克',[('20045',75),('01129',15),('11124',5),('04053',5),('02047',.3)])
    recipe('常见菜肴5','面粉 35 克、五花肉 15 克、白菜 20 克、酱油 3 克；加水煮至饺子成品 100 克',[('20081',35),('10005',15),('11119',20),('16123',3)])
    recipe('常见菜肴6','熟面 35 克、熟瘦牛肉 10 克、白菜 10 克、油 1 克、酱油 3 克；加水至含汤成品 100 克',[('20121',35),('13454',10),('11119',10),('04053',1),('16123',3)])
    recipe('常见菜肴7','面粉 35 克、五花肉 20 克、酱油 3 克；加水蒸至成品 100 克',[('20081',35),('10005',20),('16123',3)])
    recipe('常见菜肴8','生菜 40 克、黄瓜 25 克、番茄 25 克、胡萝卜 10 克；不加酱',[('11253',40),('11205',25),('11529',25),('11124',10)])
    # Missing fiber in abbreviated records is not automatically interpreted as zero.
    for key,value,note in [('主食0',.4,'膳食纤维采用 USDA 20045 熟长粒米饭作近似参考'),('主食12',1.8,'膳食纤维采用 USDA 20121 熟小麦面食作近似参考'),('肉鱼虾6',0,'无裹粉纯鳕鱼的膳食纤维按 0 估算'),('肉鱼虾7',0,'无裹粉纯虾仁的膳食纤维按 0 估算')]:
        data[key]['nutrients']['fiber']=value
        data[key]['note']=note
    assert len(data)==103,len(data)
    assert all(all(isinstance(x,(int,float)) and x>=0 for x in v['nutrients'].values()) for v in data.values())
