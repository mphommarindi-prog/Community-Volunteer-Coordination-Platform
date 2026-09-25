
const opportunities = [
  {id:1,title:"Road Cleanup",category:"Environment",location:"Newcastle",date:"20 Aug 2026",time:"09:00-14:00",spots:20,signed:14,status:"Upcoming",description:"Help clean public roads and surrounding community areas."},
  {id:2,title:"Community Garden",category:"Community",location:"Vryheid",date:"25 Aug 2026",time:"08:00-12:00",spots:15,signed:8,status:"Upcoming",description:"Assist with planting, watering and maintaining a community garden."},
  {id:3,title:"Food Donation Drive",category:"Charity",location:"Durban",date:"10 Aug 2026",time:"10:00-13:00",spots:12,signed:12,status:"Completed",description:"Help organise and distribute donated food to local families."}
];

function renderOpportunities(targetId, filter="All"){
  const target=document.getElementById(targetId); if(!target)return;
  let data=opportunities.filter(o=>filter==="All"||o.status===filter);
  target.innerHTML=data.map(o=>`
    <div class="item">
      <div>
        <h3>${o.title}</h3>
        <p>${o.date} • ${o.time} • ${o.location}</p>
        <p>${o.signed}/${o.spots} signed up • ${o.category}</p>
      </div>
      <div class="item-actions">
        <span class="badge ${o.status==="Upcoming"?"success":""}">${o.status}</span>
        <a class="btn small secondary" href="opportunity-details.html?id=${o.id}">View</a>
      </div>
    </div>`).join("") || '<div class="empty">No opportunities found.</div>';
}
function setTabs(containerId, targetId){
  const box=document.getElementById(containerId); if(!box)return;
  box.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click",()=>{
      box.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      renderOpportunities(targetId,tab.dataset.filter);
    });
  });
}
function loadOpportunity(){
  const params=new URLSearchParams(location.search), id=Number(params.get("id"))||1;
  const o=opportunities.find(x=>x.id===id)||opportunities[0];
  const el=document.getElementById("opportunityDetail"); if(!el)return;
  el.innerHTML=`
    <div class="hero"><h2>${o.title}</h2><p>${o.category} • ${o.location}</p></div>
    <div class="grid grid-2">
      <div class="card"><h3>Opportunity Details</h3>
        <div class="info-row"><strong>Date</strong>${o.date}</div>
        <div class="info-row"><strong>Time</strong>${o.time}</div>
        <div class="info-row"><strong>Available spots</strong>${o.spots-o.signed} of ${o.spots}</div>
        <div class="info-row"><strong>Status</strong>${o.status}</div>
      </div>
      <div class="card"><h3>Description</h3><p>${o.description}</p>
        ${o.status==="Upcoming"?'<button class="btn" onclick="alert(\\'Frontend demo: registration submitted.\\')">Sign Up</button>':''}
      </div>
    </div>`;
}
document.addEventListener("DOMContentLoaded",()=>{
  const signup=document.getElementById("signupForm");
  if(signup) signup.addEventListener("submit",e=>{e.preventDefault();alert("Frontend demo: opportunity created.");location.href="admin-opportunities.html";});
  const login=document.getElementById("loginForm");
  if(login) login.addEventListener("submit",e=>{e.preventDefault();location.href=document.getElementById("role").value==="admin"?"admin-dashboard.html":"volunteer-dashboard.html";});
  const profile=document.getElementById("profileForm");
  if(profile) profile.addEventListener("submit",e=>{e.preventDefault();alert("Frontend demo: profile saved.");});
});
