"""The residents in the houses have roles: the people screen counts them in each role, the chief changes the split,
the split changes what they bring and how strong the village is, and it is kept in the save. Uses the ready-made city."""
import sys, os, json, time; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import run, ROOT
CODE = open(os.path.join(ROOT, 'assets', 'gifts', 'warriorcity.amz')).read().strip()
def t(g):
    g.js("(code) => xferImport(code)", CODE) if False else None
    print('import', repr(g.page.evaluate("code => xferImport(code)", CODE)))
    g.js("continueGame(saveIndex()[0].id); window.askPreg = () => {}"); time.sleep(0.5); g.js("__clean()"); g.js("window.__freeze = true"); g.sim(1)
    print('mix', g.js("resMix()"), 'res', g.js("CLAN.residents"), 'power', round(g.js("ownPower(true)"), 1))
    g.js("campMenu('people')"); time.sleep(0.3)
    print('chips', g.js("[...$('campov').querySelectorAll('.cstock .cchip')].map(e => e.textContent)"))
    print('rows', g.js("[...$('campov').querySelectorAll('.rmrow span')].map(e => e.textContent)"))
    g.js("$('campov').querySelector('.rmix').scrollIntoView()"); g.shot('res_roles', clean=False)
    for k in range(4): g.js("$('campov').querySelector('[data-rm=\"warrior:1\"]').click()")
    print('after +warriors', g.js("resMix()"), 'w', g.js("CLAN.rmix"), 'power', round(g.js("ownPower(true)"), 1))
    st0 = g.js("({...boxStore()})"); g.js("closeCard('campov')"); g.sim(20); st1 = g.js("({...boxStore()})")
    print('20s store', {k: round(st1[k] - st0[k]) for k in ('meat', 'cooked', 'wood')})
    g.js("saveGame()"); d = g.js("JSON.parse(lsGet('amazonia-slot-' + PROG.slot)).vx.clan.rm"); print('saved rm', d)
    g.js("UI.toMenu(); continueGame(PROG.slot || saveIndex()[0].id); window.askPreg = () => {}"); time.sleep(0.5); g.js("__clean()")
    print('reloaded', g.js("CLAN.rmix"), g.js("resMix()"))
    print('errs', g.errors()[:5])
run(t)
