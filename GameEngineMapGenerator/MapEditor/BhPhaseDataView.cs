using System.Collections.Generic;
using System.Runtime.CompilerServices;
using Hex.MapQuests;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhPhaseDataView : bsq
	{
		[SerializeField]
		private TMP_InputField id;

		[SerializeField]
		private TMP_InputField nextId;

		[SerializeField]
		private TMP_InputField title;

		[SerializeField]
		private TMP_InputField textSid;

		[SerializeField]
		private Toggle isFinal;

		[SerializeField]
		private TMP_InputField timer;

		[SerializeField]
		private TMP_Dropdown mod;

		[SerializeField]
		private BhConditions conditions;

		[SerializeField]
		private BhEvents onStart;

		[SerializeField]
		private BhEvents onEnd;

		[SerializeField]
		private List<BhHierarchyGroup> hierarchyItems;

		private bool buwh;

		private bool buwi;

		public PhaseData buwg
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		private void Update()
		{
		}

		public void Init(PhaseData _phaseData)
		{
		}

		public override void nud()
		{
		}

		public void UpdateData()
		{
		}
	}
}
