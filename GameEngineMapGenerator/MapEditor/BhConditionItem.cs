using Hex.MapQuests;
using Hex.Session.Quests;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhConditionItem : bso
	{
		[SerializeField]
		private GameObject pickGroup;

		[SerializeField]
		private GameObject amountOject;

		[SerializeField]
		private GameObject targetIdObject;

		[SerializeField]
		private GameObject hireUnitObject;

		[SerializeField]
		private TextMeshProUGUI conditionLabel;

		[SerializeField]
		private TMP_Dropdown trigger;

		[SerializeField]
		private TMP_InputField description;

		[SerializeField]
		private TMP_InputField amount;

		[SerializeField]
		private TextMeshProUGUI pickText;

		[SerializeField]
		private BhHierarchyGroup hierarchyGroup;

		[SerializeField]
		private BhHierarchyGroup hierarchyGroupProgress;

		[SerializeField]
		private BhOnProgressEvents onProgressEvents;

		private BhConditions buva;

		private bqn buvb;

		private bsn buvc;

		private ConditionData buvd;

		private bool buve;

		private EConditionType buvf;

		private void Update()
		{
		}

		public void Init(ConditionData _conditionData, BhConditions _conditions)
		{
		}

		public void OnDelete()
		{
		}

		public override void UpdateValues()
		{
		}

		public void StartLookingForObject()
		{
		}

		private void nvk(EConditionType a, bool b = false)
		{
		}

		private void nvl(int a)
		{
		}

		private void nvm(int a)
		{
		}

		private void nvn(string a, string b)
		{
		}
	}
}
