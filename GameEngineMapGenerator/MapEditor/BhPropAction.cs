using System.Collections.Generic;
using System.Runtime.CompilerServices;
using Hex.QuestScript;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhPropAction : MonoBehaviour
	{
		[SerializeField]
		private GameObject referenceParam;

		[SerializeField]
		private Transform contentParams;

		[SerializeField]
		private Transform addButton;

		[SerializeField]
		public TMP_Dropdown dropdownAction;

		private BhPropertiesActions buuh;

		public List<BhPropActionParam> buug
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

		private void Awake()
		{
		}

		public void Init(BhPropertiesActions _propertiesActions, Action _scriptAction)
		{
		}

		public void nvc(string a)
		{
		}

		public void OnBtnDel()
		{
		}

		public void nvd(BhPropActionParam a)
		{
		}

		public void AddNewParam()
		{
		}
	}
}
