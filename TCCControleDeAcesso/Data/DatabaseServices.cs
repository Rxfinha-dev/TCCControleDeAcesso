using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TCCControleDeAcesso.Models;
using System.Data.Entity;


namespace TCCControleDeAcesso
{
    public class DbConnection
    {
        public class AccessControl : DbContext
        {
            public AccessControl() : base("name=AccessControl")
            {
            }

            public DbSet<Aluno> alunos{ get; set; }
            public DbSet<Curso> curso { get; set; }
            public DbSet<Empresa> empresas { get; set; }
            public DbSet<Verificacao> verificacao { get; set; }


        }
        //public static string Connection = "server=localhost;port=3306;uid=root;pwd=1234;database=AccessControl;";
    }
}
