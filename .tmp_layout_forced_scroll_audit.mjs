import { chromium, devices } from "playwright";
import fs from "fs";

(async () => {
  const browser = await chromium.launch();
  const routes = ["/", "/services", "/packages", "/availability", "/gallery", "/reviews", "/about", "/faq", "/contact", "/booking-history", "/admin"];
  const results = { desktop: [], mobile: [] };

  const auditRoute = async (page, route, isMobile = false) => {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
    
    const data = await page.evaluate(async (route) => {
      let shellType = "other";
      let ownerSelector = "document.scrollingElement";
      let owner = document.scrollingElement;

      if (document.querySelector(".public-shell-viewport")) {
        shellType = "public";
        ownerSelector = ".public-shell-viewport";
        owner = document.querySelector(".public-shell-viewport");
      } else if (document.querySelector(".admin-shell-viewport")) {
        shellType = "admin";
        ownerSelector = ".admin-shell-viewport";
        owner = document.querySelector(".admin-shell-viewport");
      }

      const before = { clientHeight: owner.clientHeight, scrollHeight: owner.scrollHeight };
      
      const filler = document.createElement("div");
      filler.style.height = (owner === document.scrollingElement ? 2800 : 2800) + "px";
      filler.style.width = "100%";
      owner.appendChild(filler);

      const after = { clientHeight: owner.clientHeight, scrollHeight: owner.scrollHeight };
      const overflowForced = after.scrollHeight > after.clientHeight;

      const initialScrollTop = owner.scrollTop;
      owner.scrollTop += 700;
      const progScrollSuccess = owner.scrollTop !== initialScrollTop;

      // Overlay detection
      const overlays = Array.from(document.querySelectorAll("*")).filter(el => {
        const s = window.getComputedStyle(el);
        if ((s.position === "fixed" || s.position === "absolute") && s.pointerEvents !== "none") {
          const r = el.getBoundingClientRect();
          return r.width >= window.innerWidth * 0.95 && r.height >= window.innerHeight * 0.95;
        }
        return false;
      }).length;

      let navInfo = null;
      if (shellType === "public") {
        const nav = document.querySelector("nav");
        const btn = nav?.querySelector("button, a");
        if (btn) {
          const s = window.getComputedStyle(btn);
          const navS = window.getComputedStyle(nav);
          navInfo = {
            btnStyle: { display: s.display, visibility: s.visibility },
            navStructured: (navS.display === "flex" || navS.display === "inline-flex") && navS.visibility !== "hidden"
          };
        }
      }

      owner.removeChild(filler);

      return {
        route,
        shellType,
        ownerSelector,
        before,
        after,
        overflowForced,
        progScrollSuccess,
        overlays,
        navInfo
      };
    }, route);

    // Wheel scroll check
    if (data.overflowForced) {
      const scrollBefore = await page.evaluate((sel) => (sel === "document.scrollingElement" ? document.scrollingElement : document.querySelector(sel)).scrollTop, data.ownerSelector);
      await page.mouse.wheel(0, 500);
      await new Promise(r => setTimeout(r, 100));
      const scrollAfter = await page.evaluate((sel) => (sel === "document.scrollingElement" ? document.scrollingElement : document.querySelector(sel)).scrollTop, data.ownerSelector);
      data.wheelScrollSuccess = scrollAfter !== scrollBefore;
    } else {
      data.wheelScrollSuccess = false;
    }

    return data;
  };

  // Desktop
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const route of routes) {
    results.desktop.push(await auditRoute(page, route));
  }
  await context.close();

  // Mobile
  const mobileContext = await browser.newContext({ ...devices["iPhone 13"] });
  const mobilePage = await mobileContext.newPage();
  for (const route of ["/availability", "/admin"]) {
    results.mobile.push(await auditRoute(mobilePage, route, true));
  }
  await mobileContext.close();

  fs.writeFileSync(".tmp_layout_forced_scroll_results.json", JSON.stringify(results, null, 2));
  console.log("WROTE .tmp_layout_forced_scroll_results.json");
  await browser.close();
})();
