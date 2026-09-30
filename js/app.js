const products = PRODUCT_DATA;
let cart = JSON.parse(localStorage.getItem("furniqueCart") || "[]");
let activeCategory = "All";
let activeStyle = "All";
let modalProductId = null;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function moneyToNumber(price){ return Number(price.replace(/[₹,]/g,"")); }

function renderProducts(){
  const grid = $("#productGrid");
  const filtered = products.filter(p =>
    (activeCategory === "All" || p.category === activeCategory) &&
    (activeStyle === "All" || p.style === activeStyle)
  );
  grid.innerHTML = filtered.length ? filtered.map(p => `
    <article class="product-card">
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <button class="quick-view" data-view="${p.id}">Quick view</button>
      </div>
      <div class="product-meta">
        <span class="style">${p.style}</span>
        <h3>${p.name}</h3>
        <span class="price">${p.price}</span>
        <button class="add-btn" data-add="${p.id}" aria-label="Add ${p.name}">+</button>
      </div>
    </article>
  `).join("") : `<div class="empty">No furniture found for these filters.</div>`;
}

function saveCart(){ localStorage.setItem("furniqueCart", JSON.stringify(cart)); }
function updateCartCount(){ $("#cartCount").textContent = cart.reduce((sum,item)=>sum+item.qty,0); }

function addToCart(id){
  const product = products.find(p=>p.id===id);
  const existing = cart.find(item=>item.id===id);
  if(existing) existing.qty++;
  else cart.push({id,qty:1});
  saveCart(); updateCartCount(); renderCart();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(id){
  cart = cart.filter(item=>item.id!==id);
  saveCart(); updateCartCount(); renderCart();
}

function renderCart(){
  const box = $("#cartItems");
  if(!cart.length){
    box.innerHTML = `<div class="empty">Your cart is empty.<br><br><a class="text-link" href="#shop" id="continueShopping">Explore furniture →</a></div>`;
    $("#cartTotal").textContent = "₹0";
    return;
  }
  let total=0;
  box.innerHTML = cart.map(item=>{
    const p=products.find(x=>x.id===item.id);
    const n=moneyToNumber(p.price)*item.qty; total+=n;
    return `<div class="cart-line">
      <img src="${p.image}" alt="${p.name}">
      <div><h4>${p.name}</h4><p>${p.price} × ${item.qty}</p></div>
      <button class="remove" data-remove="${p.id}" aria-label="Remove">×</button>
    </div>`;
  }).join("");
  $("#cartTotal").textContent = "₹"+total.toLocaleString("en-IN");
}

function showToast(message){
  const t=$("#toast"); t.textContent=message; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}

function openProduct(id){
  const p=products.find(x=>x.id===id); if(!p)return;
  modalProductId=id;
  $("#modalImage").src=p.image; $("#modalImage").alt=p.name;
  $("#modalStyle").textContent=p.style+" · "+p.category;
  $("#modalName").textContent=p.name; $("#modalDescription").textContent=p.description;
  $("#modalPrice").textContent=p.price;
  $("#productModal").classList.add("open");
}

function searchProducts(term){
  const q=term.toLowerCase().trim();
  const result=$("#searchResults");
  if(!q){result.innerHTML="";return;}
  const found=products.filter(p=>(p.name+" "+p.category+" "+p.style).toLowerCase().includes(q)).slice(0,8);
  result.innerHTML=found.length ? found.map(p=>`
    <button class="search-result" data-view="${p.id}">
      <img src="${p.image}" alt="${p.name}"><span><strong>${p.name}</strong><br><small>${p.category} · ${p.price}</small></span>
    </button>`).join("") : `<p style="padding:20px 0;color:#777">No matching furniture.</p>`;
}

$("#categoryFilters").addEventListener("click",e=>{
  const btn=e.target.closest("[data-category]"); if(!btn)return;
  $$(".chip").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
  activeCategory=btn.dataset.category; renderProducts();
});
$("#styleFilter").addEventListener("change",e=>{activeStyle=e.target.value;renderProducts()});

document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]"); if(add)addToCart(Number(add.dataset.add));
  const view=e.target.closest("[data-view]"); if(view)openProduct(Number(view.dataset.view));
  const rem=e.target.closest("[data-remove]"); if(rem)removeFromCart(Number(rem.dataset.remove));
  const collection=e.target.closest("[data-filter]"); if(collection){
    activeCategory=collection.dataset.filter; activeStyle="All";
    $$(".chip").forEach(x=>x.classList.toggle("active",x.dataset.category===activeCategory));
    $("#styleFilter").value="All"; renderProducts(); $("#shop").scrollIntoView({behavior:"smooth"});
  }
  const style=e.target.closest("[data-style]"); if(style){
    activeStyle=style.dataset.style; activeCategory="All";
    $$(".chip").forEach(x=>x.classList.toggle("active",x.dataset.category==="All"));
    $("#styleFilter").value=activeStyle; renderProducts(); $("#shop").scrollIntoView({behavior:"smooth"});
  }
});

$("#cartBtn").onclick=()=>{$("#cartDrawer").classList.add("open");$("#overlay").classList.add("open");renderCart()};
$("#closeCart").onclick=()=>{$("#cartDrawer").classList.remove("open");$("#overlay").classList.remove("open")};
$("#overlay").onclick=()=>{$("#cartDrawer").classList.remove("open");$("#overlay").classList.remove("open")};
$("#searchBtn").onclick=()=>{$("#searchModal").classList.add("open");setTimeout(()=>$("#searchInput").focus(),100)};
$("#closeSearch").onclick=()=>$("#searchModal").classList.remove("open");
$("#searchInput").addEventListener("input",e=>searchProducts(e.target.value));
$("#closeProduct").onclick=()=>$("#productModal").classList.remove("open");
$("#modalAdd").onclick=()=>{addToCart(modalProductId);$("#productModal").classList.remove("open")};
$(".menu-toggle").onclick=()=>$(".nav").classList.toggle("open");

$("#newsletterForm").addEventListener("submit",e=>{
  e.preventDefault(); showToast("Thanks! You're on the list."); e.target.reset();
});
$("#checkoutBtn").onclick=()=>{
  if(!cart.length){showToast("Your cart is empty");return;}
  const items=cart.map(i=>{const p=products.find(x=>x.id===i.id);return `${p.name} x${i.qty}`}).join(", ");
  const subject=encodeURIComponent("Furniture enquiry");
  const body=encodeURIComponent("Hello Furnique,%0D%0AI would like to enquire about:%0D%0A"+items);
  window.location.href=`mailto:hello@example.com?subject=${subject}&body=${body}`;
};

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    $("#searchModal").classList.remove("open");$("#productModal").classList.remove("open");
    $("#cartDrawer").classList.remove("open");$("#overlay").classList.remove("open");
  }
});
renderProducts(); updateCartCount(); renderCart();
